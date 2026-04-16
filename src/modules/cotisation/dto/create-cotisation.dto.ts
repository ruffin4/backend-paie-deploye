import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TypeBaseCotisation } from '../entities/cotisation.entity';

export class CreateCotisationDto {
  @ApiProperty({
    example: 'CNaPS',
    description: 'Code unique de la cotisation',
  })
  @IsString()
  code!: string;

  @ApiProperty({
    example: 'Caisse Nationale de Prévoyance Sociale',
    description: 'Libellé complet',
  })
  @IsString()
  libelle!: string;

  @ApiProperty({
    example: 1.0,
    description: 'Taux employé (en %)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  tauxSalarie!: number;

  @ApiProperty({
    example: 13.0,
    description: 'Taux employeur (en %)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  tauxEmployeur!: number;

  @ApiProperty({
    required: false,
    example: null,
    description: 'Plafond de calcul (null = pas de plafond)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  plafond?: number;

  @ApiProperty({
    enum: TypeBaseCotisation,
    default: TypeBaseCotisation.BRUT_TOTAL,
  })
  @IsEnum(TypeBaseCotisation)
  typeBase!: TypeBaseCotisation;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Date de début de validité',
  })
  @IsDateString()
  dateDebut!: string;

  @ApiProperty({
    required: false,
    example: null,
    description: 'Date de fin de validité',
  })
  @IsDateString()
  @IsOptional()
  dateFin?: string;
}
