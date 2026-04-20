import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculBulletinDto {
  @ApiProperty({ description: "UUID de l'employé" })
  @IsUUID()
  employeUuid!: string;

  @ApiProperty({ description: 'UUID de la période' })
  @IsUUID()
  periodeUuid!: string;

  @ApiProperty({ required: false, description: 'Date de calcul' })
  @IsDateString()
  @IsOptional()
  date?: string;
}
