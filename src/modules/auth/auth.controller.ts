/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  BadRequestException,
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
import { MustSetPasswordGuard } from './guards/must-set-password.guard';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: "Inscription d'un nouvel utilisateur" })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
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
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      message: 'Connexion réussie',
      ...result,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, MustSetPasswordGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Récupérer le profil utilisateur' })
  async getProfile(@Request() req: any) {
    const userId = req.user.uuid;
    const user = await this.authService.getProfile(userId);
    return {
      message: 'Profil récupéré avec succès',
      user,
    };
  }

  // --- Nouveaux endpoints avancés ---

  @Post('admin/create-manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Création d'un gestionnaire par l'admin" })
  async createManager(@Body() createDto: any, @Request() req) {
    return this.authService.createManager(createDto, req.user.uuid);
  }

  @Post('admin/resend-invitation/:uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Renvoyer l'email d'invitation à un gestionnaire" })
  async resendInvitation(@Param('uuid') uuid: string) {
    return this.authService.resendInvitation(uuid);
  }

  @Public()
  @Post('set-password')
  @ApiOperation({ summary: 'Configuration initiale du mot de passe' })
  async setPassword(@Body() body: any) {
    if (!body?.token) {
      throw new BadRequestException('Token is required');
    }
    const token = body.token;
    const password = body.password;
    return this.authService.setPassword(token, password);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('forgot-password')
  @ApiOperation({ summary: 'Demande de réinitialisation de mot de passe' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialisation du mot de passe avec token' })
  async resetPassword(@Body() body: { token: string; password: any }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Déconnexion utilisateur' })
  logout() {
    return this.authService.logout();
  }

  // --- Gestion des utilisateurs (Admin seulement) ---

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
