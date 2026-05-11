import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { UserRole } from '../interfaces/user.interface';

export class RegisterDto {
  @ApiProperty({
    example: 'user@payroll.mg',
    description: "Email de l'utilisateur",
  })
  @IsEmail({}, { message: 'Email invalide' })
  email!: string;

  @ApiProperty({ example: 'jrakoto', description: "Nom d'utilisateur" })
  @IsString()
  @MinLength(3)
  username!: string;

  @ApiProperty({ example: 'password123', description: 'Mot de passe' })
  @IsString()
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password!: string;

  @ApiProperty({ example: 'RAKOTO', description: 'Nom', required: false })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiProperty({ example: 'Jean', description: 'Prénom', required: false })
  @IsString()
  @IsOptional()
  prenom?: string;

  @ApiProperty({
    example: 'GESTIONNAIRE',
    description: 'Rôle',
    enum: ['ADMIN', 'GESTIONNAIRE'],
    required: false,
  })
  @IsEnum(['ADMIN', 'GESTIONNAIRE'])
  @IsOptional()
  role?: UserRole;
}
