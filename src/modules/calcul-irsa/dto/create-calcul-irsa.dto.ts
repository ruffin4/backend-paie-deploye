import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCalculIrsaDto {
  @ApiProperty({ description: 'UUID du bulletin' })
  @IsUUID()
  bulletinUuid!: string;

  @ApiProperty({ description: 'Base imposable' })
  @IsNumber()
  @Min(0)
  baseImposable!: number;

  @ApiProperty({ description: 'Abattement' })
  @IsNumber()
  @Min(0)
  abattement!: number;

  @ApiProperty({ description: 'Total impôt' })
  @IsNumber()
  @Min(0)
  totalImpot!: number;

  @ApiProperty({ description: 'Décote', required: false, default: 0 })
  @IsNumber()
  @Min(0)
  decote?: number;

  @ApiProperty({ description: "Nombre d'enfants", required: false, default: 0 })
  @IsNumber()
  @Min(0)
  nbEnfants?: number;
}
