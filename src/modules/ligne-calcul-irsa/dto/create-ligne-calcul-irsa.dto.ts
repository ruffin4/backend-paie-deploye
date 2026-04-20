import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLigneCalculIrsaDto {
  @ApiProperty({ description: 'UUID du calcul IRSA' })
  @IsUUID()
  calculIrsaUuid!: string;

  @ApiProperty({ description: 'ID de la tranche (UUID)' })
  @IsUUID()
  trancheId!: string;

  @ApiProperty({ description: 'Montant dans la tranche' })
  @IsNumber()
  @Min(0)
  montantTranche!: number;

  @ApiProperty({ description: 'Impôt de la tranche' })
  @IsNumber()
  @Min(0)
  impotTranche!: number;
}
