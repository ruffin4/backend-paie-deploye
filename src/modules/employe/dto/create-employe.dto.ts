import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TypeContrat } from '../entities/employe.entity';

export class CreateEmployeDto {
  @ApiProperty({ example: 'MAT-001', description: 'Matricule interne' })
  @IsString()
  matriculeInterne!: string;

  @ApiProperty({ example: 'CNAPS-123', required: false })
  @IsOptional()
  @IsString()
  matriculeCnaps?: string;

  @ApiProperty({ example: 'RAKOTO', description: 'Nom' })
  @IsString()
  nom!: string;

  @ApiProperty({ example: 'Jean', required: false })
  @IsOptional()
  @IsString()
  prenom?: string;

  @ApiProperty({ example: '2024-01-01', description: "Date d'embauche" })
  @IsDateString()
  dateEmbauche!: string;

  @ApiProperty({ example: TypeContrat.CDI, enum: TypeContrat })
  @IsEnum(TypeContrat)
  typeContrat!: TypeContrat;

  @ApiProperty({ example: '2025-01-01', required: false })
  @IsOptional()
  @IsDateString()
  dateSortie?: string;

  @ApiProperty({ example: 'Développeur', required: false })
  @IsOptional()
  @IsString()
  fonction?: string;

  @ApiProperty({ example: 'A', required: false })
  @IsOptional()
  @IsString()
  categorie?: string;

  @ApiProperty({ example: 1500000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaireBaseMensuel!: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  nbEnfants?: number;

  @ApiProperty({ example: 'Lot II M 45 bis Antananarivo', required: false })
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiProperty({ example: '034 00 000 00', required: false })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  actif?: boolean;
}
