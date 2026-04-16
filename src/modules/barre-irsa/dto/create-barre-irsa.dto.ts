import {
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBarreIrsaDto {
  @ApiProperty({ example: 0, description: 'Borne inférieure de la tranche' })
  @IsNumber()
  @Min(0)
  trancheMin!: number;

  @ApiProperty({
    example: 350000,
    required: false,
    description: 'Borne supérieure de la tranche (null = infini)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  trancheMax?: number;

  @ApiProperty({
    example: 0,
    description: "Taux d'imposition en pourcentage",
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  taux!: number;

  @ApiProperty({ example: 1, description: "Ordre d'application des tranches" })
  @IsNumber()
  @Min(1)
  ordre!: number;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Date de début de validité',
  })
  @IsDateString()
  dateDebut!: string;

  @ApiProperty({
    example: '2025-12-31',
    required: false,
    description: 'Date de fin de validité',
  })
  @IsDateString()
  @IsOptional()
  dateFin?: string;
}
