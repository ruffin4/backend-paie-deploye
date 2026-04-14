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

// Interface pour un utilisateur (à remplacer par votre entité User)
interface User {
  uuid: string;
  email: string;
  passwordHash: string;
  nom?: string;
  prenom?: string;
  role: string;
}

@Injectable()
export class AuthService {
  // Base de données temporaire (à remplacer par votre entité User)
  private users: User[] = [];
  private nextId = 1;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    // Créer un utilisateur admin par défaut
    void this.createDefaultAdmin();
  }

  private async createDefaultAdmin() {
    const adminEmail = this.configService.get<string>(
      'DEFAULT_ADMIN_EMAIL',
      'admin@payroll.mg',
    );
    const adminPassword = this.configService.get<string>(
      'DEFAULT_ADMIN_PASSWORD',
      'admin123',
    );
    const adminNom = this.configService.get<string>(
      'DEFAULT_ADMIN_NOM',
      'Admin',
    );
    const adminPrenom = this.configService.get<string>(
      'DEFAULT_ADMIN_PRENOM',
      'System',
    );
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);

    const adminExists = this.users.find((u) => u.email === adminEmail);
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
      this.users.push({
        uuid: `uuid-${this.nextId++}`,
        email: adminEmail,
        passwordHash: hashedPassword,
        nom: adminNom,
        prenom: adminPrenom,
        role: 'ADMIN',
      });
      console.log(`Admin par défaut créé: ${adminEmail} / ${adminPassword}`);
    }
  }

  async register(registerDto: RegisterDto) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = this.users.find((u) => u.email === registerDto.email);
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hacher le mot de passe
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Créer l'utilisateur
    const newUser: User = {
      uuid: `uuid-${this.nextId++}`,
      email: registerDto.email,
      passwordHash: hashedPassword,
      nom: registerDto.nom,
      prenom: registerDto.prenom,
      role: 'GESTIONNAIRE',
    };

    this.users.push(newUser);

    // Générer le token
    const payload = {
      sub: newUser.uuid,
      email: newUser.email,
      role: newUser.role,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        uuid: newUser.uuid,
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        role: newUser.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Vérifier l'email
    const user = this.users.find((u) => u.email === loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Générer le token JWT
    const payload = { sub: user.uuid, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        uuid: user.uuid,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    };
  }
  validateUserById(id: string) {
    const user = this.users.find((u) => u.uuid === id);
    if (!user) return null;
    return {
      uuid: user.uuid,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    };
  }

  getProfile(userId: string) {
    const user = this.users.find((u) => u.uuid === userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return {
      uuid: user.uuid,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    };
  }

  logout() {
    // Pour JWT, le logout se fait côté client (suppression du token)
    return { message: 'Déconnexion réussie' };
  }
}
