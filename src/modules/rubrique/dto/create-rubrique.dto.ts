import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TypeRubrique,
  ModeCalcul,
  SensRubrique,
} from '../entities/rubrique.entity';

export class CreateRubriqueDto {
  @ApiProperty({
    example: 'SAL_BASE',
    description: 'Code unique de la rubrique',
  })
  @IsString()
  code!: string;

  @ApiProperty({
    example: 'Salaire de base',
    description: 'Libellé de la rubrique',
  })
  @IsString()
  libelle!: string;

  @ApiProperty({ required: false, description: 'Description détaillée' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TypeRubrique, example: TypeRubrique.GAIN })
  @IsEnum(TypeRubrique)
  type!: TypeRubrique;

  @ApiProperty({ enum: ModeCalcul, example: ModeCalcul.FIXE })
  @IsEnum(ModeCalcul)
  modeCalcul!: ModeCalcul;

  @ApiProperty({ required: false, example: 900000 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  valeurFixe?: number;

  @ApiProperty({ required: false, example: 1.0, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  pourcentageBase?: number;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  estImposableIRSA?: boolean;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  estCotisableCNaPS?: boolean;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  estCotisableOSTIE?: boolean;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  estCotisableFMFPR?: boolean;

  @ApiProperty({
    enum: SensRubrique,
    default: SensRubrique.POSITIF,
    required: false,
  })
  @IsEnum(SensRubrique)
  @IsOptional()
  sens?: SensRubrique;

  @ApiProperty({ default: 0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  ordreAffichage?: number;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
