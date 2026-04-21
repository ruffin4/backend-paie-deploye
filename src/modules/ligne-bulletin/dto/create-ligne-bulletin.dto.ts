import { IsUUID, IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLigneBulletinDto {
  @ApiProperty({ description: 'UUID du bulletin' })
  @IsUUID()
  bulletinUuid!: string;

  @ApiProperty({ description: 'UUID de la rubrique' })
  @IsUUID()
  rubriqueUuid!: string;

  @ApiProperty({ required: false, description: 'Base de calcul' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  base?: number | null;

  @ApiProperty({ required: false, description: 'Taux appliqué' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taux?: number | null;

  @ApiProperty({ description: 'Montant part salarié' })
  @IsNumber()
  @Min(0)
  montantSalarie!: number;

  @ApiProperty({ required: false, description: 'Montant part employeur' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  montantEmployeur?: number | null;

  @ApiProperty({ required: false, description: 'Référence' })
  @IsString()
  @IsOptional()
  reference?: string;
}
