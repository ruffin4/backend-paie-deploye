/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IUserResponse } from './interfaces/user.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UsedTokenEntity } from './entities/used-token.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UsedTokenEntity)
    private readonly usedTokenRepository: Repository<UsedTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    void this.createDefaultAdmin();
  }

  private getSaltRounds(): number {
    const saltRoundsRaw = this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    let saltRounds = Number(saltRoundsRaw ?? 10);
    if (!Number.isFinite(saltRounds) || saltRounds <= 0) {
      saltRounds = 10;
    }
    return Math.round(saltRounds);
  }

  private async createDefaultAdmin() {
    const adminEmail =
      this.configService.get<string>('DEFAULT_ADMIN_EMAIL') ??
      'admin@payroll.mg';
    const adminExists = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!adminExists) {
      try {
        const saltRounds = this.getSaltRounds();
        const salt = await bcrypt.genSalt(saltRounds);
        const adminPassword =
          this.configService.get<string>('DEFAULT_ADMIN_PASSWORD') ??
          'admin123';
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const admin = this.userRepository.create();
        Object.assign(admin, {
          email: adminEmail,
          username: 'admin',
          passwordHash: hashedPassword,
          nom: this.configService.get<string>('DEFAULT_ADMIN_NOM') ?? 'Admin',
          prenom:
            this.configService.get<string>('DEFAULT_ADMIN_PRENOM') ?? 'System',
          role: 'ADMIN',
          mustSetPassword: false,
        });

        await this.userRepository.save(admin);
        console.log(
          `✅ Admin par défaut créé: ${adminEmail} / ${this.configService.get<string>('DEFAULT_ADMIN_PASSWORD') ?? 'admin123'}`,
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(
          "❌ Erreur lors de la création de l'admin par défaut:",
          errorMessage,
        );
      }
    }
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { username: registerDto.username }],
    });

    if (existingUser) {
      throw new ConflictException("Email ou nom d'utilisateur déjà utilisé");
    }

    const saltRounds = this.getSaltRounds();
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const user = this.userRepository.create();
    Object.assign(user, {
      email: registerDto.email,
      username: registerDto.username,
      passwordHash: hashedPassword,
      nom: registerDto.nom,
      prenom: registerDto.prenom,
      role: registerDto.role ?? 'GESTIONNAIRE',
      mustSetPassword: false,
    });

    const saved = await this.userRepository.save(user);
    return this.generateAuthResponse(saved);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: [{ email: loginDto.email }, { username: loginDto.email }],
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    return this.generateAuthResponse(user);
  }

  private generateAuthResponse(user: UserEntity) {
    const payload = {
      sub: user.uuid,
      email: user.email,
      role: user.role,
      mustSetPassword: user.mustSetPassword,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        uuid: user.uuid,
        email: user.email,
        username: user.username,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        mustSetPassword: user.mustSetPassword,
      },
    };
  }

  // --- Nouveaux Flows ---

  async createManager(createDto: any, adminUuid: string) {
    const existing = await this.userRepository.findOne({
      where: [{ email: createDto.email }, { username: createDto.username }],
    });
    if (existing) {
      throw new ConflictException("Email ou nom d'utilisateur déjà utilisé");
    }

    const manager = this.userRepository.create();
    Object.assign(manager, {
      ...createDto,
      role: 'GESTIONNAIRE',
      mustSetPassword: true,
      createdBy: adminUuid,
      passwordHash: null,
    });

    const saved = await this.userRepository.save(manager);

    // Générer token SET_PASSWORD (48h)
    const setupToken = this.jwtService.sign(
      { sub: saved.uuid, type: 'SET_PASSWORD' },
      {
        secret: this.configService.get<string>('JWT_SETUP_SECRET'),
        expiresIn: '48h',
      },
    );

    try {
      await this.mailService.sendWelcomeManager(
        saved.email,
        saved.username || saved.email,
        setupToken,
      );
      saved.invitationSent = true;
      await this.userRepository.save(saved);
    } catch (err) {
      console.error('Failed to send welcome email:', err);
      return {
        message:
          "Gestionnaire créé, mais l'envoi de l'email a échoué (problème de connexion). Vous pouvez le renvoyer manuellement depuis la liste.",
        emailError: true,
      };
    }

    return { message: 'Gestionnaire créé et email envoyé' };
  }

  async resendInvitation(uuid: string) {
    const user = await this.userRepository.findOne({ where: { uuid } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (!user.mustSetPassword) {
      throw new BadRequestException('Cet utilisateur a déjà activé son compte');
    }

    // Générer un nouveau token SET_PASSWORD (48h)
    const setupToken = this.jwtService.sign(
      { sub: user.uuid, type: 'SET_PASSWORD' },
      {
        secret: this.configService.get<string>('JWT_SETUP_SECRET'),
        expiresIn: '48h',
      },
    );

    try {
      await this.mailService.sendWelcomeManager(
        user.email,
        user.username || user.email,
        setupToken,
      );
      user.invitationSent = true;
      await this.userRepository.save(user);
    } catch (err) {
      this.logger.error(`Failed to resend invitation: ${err.message}`);
      throw new BadRequestException(
        "L'envoi de l'email a échoué. Veuillez vérifier votre connexion internet et réessayer.",
      );
    }

    return { message: 'Email de bienvenue renvoyé avec succès' };
  }

  async setPassword(token: string, password: any) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SETUP_SECRET'),
      });
    } catch (e: any) {
      throw new BadRequestException('Token invalide ou expiré');
    }

    if (payload.type !== 'SET_PASSWORD') {
      throw new BadRequestException('Type de token incorrect');
    }

    // Vérifier anti-replay
    const used = await this.usedTokenRepository.findOne({ where: { token } });
    if (used) {
      throw new BadRequestException('Ce lien a déjà été utilisé');
    }

    const user = await this.userRepository.findOne({
      where: { uuid: payload.sub },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const saltRounds = this.getSaltRounds();
    const salt = await bcrypt.genSalt(saltRounds);
    user.passwordHash = await bcrypt.hash(String(password), salt);
    user.mustSetPassword = false;

    await this.userRepository.save(user);

    // Blacklist token
    await this.usedTokenRepository.save({
      token,
      userId: user.uuid,
    });

    return { message: 'Mot de passe configuré avec succès' };
  }

  async forgotPassword(emailOrUsername: string) {
    const user = await this.userRepository.findOne({
      where: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    // On ne jette pas d'erreur pour ne pas révéler l'existence du compte
    if (user) {
      const resetToken = this.jwtService.sign(
        { sub: user.uuid, type: 'RESET_PASSWORD' },
        {
          secret: this.configService.get<string>('JWT_RESET_SECRET'),
          expiresIn: '15min',
        },
      );

      await this.mailService.sendPasswordReset(
        user.email,
        user.username || user.email,
        resetToken,
      );
    }

    return {
      message:
        'Si un compte correspond à cet identifiant, un email a été envoyé.',
    };
  }

  async resetPassword(token: string, newPassword: any) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
      });
    } catch (e) {
      throw new BadRequestException('Token invalide ou expiré');
    }

    if (payload.type !== 'RESET_PASSWORD') {
      throw new BadRequestException('Type de token incorrect');
    }

    const used = await this.usedTokenRepository.findOne({ where: { token } });
    if (used) {
      throw new BadRequestException('Ce lien a déjà été utilisé');
    }

    // eslint-disable-next-line prettier/prettier
    const user = await this.userRepository.findOne({ where: { uuid: payload.sub } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const saltRounds = this.getSaltRounds();
    const salt = await bcrypt.genSalt(saltRounds);
    user.passwordHash = await bcrypt.hash(String(newPassword), salt);

    await this.userRepository.save(user);

    // Blacklist token
    await this.usedTokenRepository.save({
      token,
      userId: user.uuid,
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  // --- Utility Methods ---

  async validateUserById(id: string): Promise<IUserResponse | null> {
    const user = await this.userRepository.findOne({ where: { uuid: id } });
    if (!user) return null;

    return {
      uuid: user.uuid,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      mustSetPassword: user.mustSetPassword,
      invitationSent: user.invitationSent,
    };
  }

  async getProfile(userId: string): Promise<IUserResponse> {
    const user = await this.userRepository.findOne({ where: { uuid: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return {
      uuid: user.uuid,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      mustSetPassword: user.mustSetPassword,
      invitationSent: user.invitationSent,
    };
  }

  async findAll(): Promise<IUserResponse[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
    return users.map((u) => ({
      uuid: u.uuid,
      email: u.email,
      nom: u.nom,
      prenom: u.prenom,
      role: u.role,
      mustSetPassword: u.mustSetPassword,
      invitationSent: u.invitationSent,
    }));
  }

  async update(uuid: string, updateDto: any): Promise<IUserResponse> {
    const user = await this.userRepository.findOne({ where: { uuid } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    if (updateDto.password) {
      const saltRounds = this.getSaltRounds();
      const salt = await bcrypt.genSalt(saltRounds);
      user.passwordHash = await bcrypt.hash(String(updateDto.password), salt);
    }

    if (updateDto.email) user.email = updateDto.email;
    if (updateDto.username) user.username = updateDto.username;
    if (updateDto.nom) user.nom = updateDto.nom;
    if (updateDto.prenom) user.prenom = updateDto.prenom;
    if (updateDto.role) user.role = updateDto.role;

    const saved = await this.userRepository.save(user);
    return {
      uuid: saved.uuid,
      email: saved.email,
      nom: saved.nom,
      prenom: saved.prenom,
      role: saved.role,
      mustSetPassword: saved.mustSetPassword,
      invitationSent: saved.invitationSent,
    };
  }

  async remove(uuid: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { uuid } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }
    await this.userRepository.remove(user);
  }

  logout() {
    return { message: 'Déconnexion réussie' };
  }
}
