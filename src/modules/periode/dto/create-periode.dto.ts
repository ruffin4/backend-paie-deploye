import {
  IsInt,
  Min,
  Max,
  IsDateString,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePeriodeDto {
  @ApiProperty({
    example: 3,
    minimum: 1,
    maximum: 12,
    description: 'Mois (1 à 12)',
  })
  @IsInt()
  @Min(1)
  @Max(12)
  mois!: number;

  @ApiProperty({
    example: 2025,
    description: 'Année',
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  annee!: number;

  @ApiProperty({
    example: '2025-03-01',
    description: 'Date de début de la période',
  })
  @IsDateString()
  dateDebut!: string;

  @ApiProperty({
    example: '2025-03-31',
    description: 'Date de fin de la période',
  })
  @IsDateString()
  dateFin!: string;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  cloturee?: boolean;
}
