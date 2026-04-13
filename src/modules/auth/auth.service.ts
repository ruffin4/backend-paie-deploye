/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    void this.createDefaultAdmin();
  }

  // Méthode utilitaire pour obtenir le salt rounds
  private getSaltRounds(): number {
    const saltRoundsRaw = this.configService.get<string>('BCRYPT_SALT_ROUNDS');
    let saltRounds = Number(saltRoundsRaw ?? 10);
    if (!Number.isFinite(saltRounds) || saltRounds <= 0) {
      saltRounds = 10;
    }
    return Math.round(saltRounds);
  }

  private async createDefaultAdmin() {
    const adminEmail = 'admin@payroll.mg';
    const adminExists = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!adminExists) {
      try {
        const saltRounds = this.getSaltRounds();
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const admin = this.userRepository.create({
          email: adminEmail,
          passwordHash: hashedPassword,
          nom: 'Admin',
          prenom: 'System',
          role: 'ADMIN',
        });

        await this.userRepository.save(admin);
        console.log('✅ Admin par défaut créé: admin@payroll.mg / admin123');
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errorMessage =
          err instanceof Error
            ? err.message
            : err && typeof err === 'object' && 'message' in err
              ? (err as any).message
              : String(err);
        console.error(
          "❌ Erreur lors de la création de l'admin par défaut:",
          errorMessage,
        );
      }
    }
  }

  async register(registerDto: RegisterDto) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const saltRounds = this.getSaltRounds();
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // Créer l'utilisateur
    const user = this.userRepository.create({
      email: registerDto.email,
      passwordHash: hashedPassword,
      nom: registerDto.nom,
      prenom: registerDto.prenom,
      role: registerDto.role ?? 'USER',
    });

    const saved = await this.userRepository.save(user);

    // Générer le token JWT
    const payload = {
      sub: saved.id,
      email: saved.email,
      role: saved.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: saved.id,
        email: saved.email,
        nom: saved.nom,
        prenom: saved.prenom,
        role: saved.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Chercher l'utilisateur
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    // Vérifier l'existence et le mot de passe
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer le token JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    };
  }

  async validateUserById(id: number): Promise<IUserResponse | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    };
  }

  async getProfile(userId: number): Promise<IUserResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    };
  }

  logout() {
    return { message: 'Déconnexion réussie' };
  }
}
