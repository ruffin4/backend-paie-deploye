import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVariableMensuelleDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: "UUID de l'employé",
  })
  @IsUUID()
  employeUuid!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'UUID de la rubrique',
  })
  @IsUUID()
  rubriqueUuid!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'UUID de la période',
  })
  @IsUUID()
  periodeUuid!: string;

  @ApiProperty({
    example: 405000,
    description: "Montant (Ar ou nombre d'heures)",
  })
  @IsNumber()
  @Min(0)
  montant!: number;

  @ApiProperty({
    required: false,
    example: 1640000,
    description: 'Base personnalisée (optionnelle)',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  basePersonnalisee?: number;

  @ApiProperty({
    required: false,
    example: 'Prime production Mars 2025',
    description: 'Commentaire',
  })
  @IsString()
  @IsOptional()
  commentaire?: string;
}
