import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@ApiTags('auth')
@Controller('auth') // Retiré @ApiBearerAuth d'ici car certains endpoints sont publics
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: "Inscription d'un nouvel utilisateur" })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      message: 'Utilisateur créé avec succès',
      ...result,
    };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Connexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Email ou mot de passe incorrect' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Connexion réussie',
      ...result,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth') // Ajouté ici pour indiquer que cet endpoint nécessite un token
  @ApiOperation({ summary: 'Récupérer le profil utilisateur' })
  @ApiResponse({ status: 200, description: 'Profil récupéré avec succès' })
  @ApiResponse({ status: 401, description: 'Utilisateur non authentifié' })
  async getProfile(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const userId = req.user.uuid; // req.user est déjà peuplé par JwtAuthGuard
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const user = await this.authService.getProfile(userId);
    return {
      message: 'Profil récupéré avec succès',
      user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Déconnexion utilisateur' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  logout() {
    return this.authService.logout();
  }

  // ── Gestion des utilisateurs (Admin seulement) ──

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lister tous les utilisateurs (Admin)' })
  async findAll() {
    const users = await this.authService.findAll();
    return {
      message: 'Liste des utilisateurs récupérée',
      data: users,
    };
  }

  @Patch('users/:uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur (Admin)' })
  async update(@Param('uuid') uuid: string, @Body() updateDto: any) {
    const user = await this.authService.update(uuid, updateDto);
    return {
      message: 'Utilisateur mis à jour avec succès',
      data: user,
    };
  }

  @Delete('users/:uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Supprimer un utilisateur (Admin)' })
  async remove(@Param('uuid') uuid: string) {
    await this.authService.remove(uuid);
    return {
      message: 'Utilisateur supprimé avec succès',
    };
  }
}
