import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatutBulletin } from '../entities/bulletin.entity';

export class CreateBulletinDto {
  @ApiProperty({ description: "UUID de l'employé" })
  @IsUUID()
  employeUuid!: string;

  @ApiProperty({ description: 'UUID de la période' })
  @IsUUID()
  periodeUuid!: string;

  @ApiProperty({ required: false, description: "Date d'édition" })
  @IsOptional()
  dateEdition?: Date;

  @ApiProperty({
    enum: StatutBulletin,
    required: false,
    default: StatutBulletin.BROUILLON,
  })
  @IsEnum(StatutBulletin)
  @IsOptional()
  statut?: StatutBulletin;

  @ApiProperty({ required: false, description: 'Salaire brut' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salaireBrut?: number;

  @ApiProperty({ required: false, description: 'Total des retenues' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalRetenues?: number;

  @ApiProperty({
    required: false,
    description: 'Total des cotisations patronales',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalCotisationsPatronales?: number;

  @ApiProperty({ required: false, description: 'Net à payer' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  netAPayer?: number;

  @ApiProperty({ required: false, description: 'Commentaire' })
  @IsString()
  @IsOptional()
  commentaire?: string;
}
