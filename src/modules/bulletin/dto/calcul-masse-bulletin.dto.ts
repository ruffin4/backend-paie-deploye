import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculMasseBulletinDto {
  @ApiProperty({ description: 'UUID de la période' })
  @IsUUID()
  periodeUuid!: string;

  @ApiProperty({ required: false, description: 'Date de calcul' })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({
    required: false,
    description: 'Liste des UUIDs des employés à calculer',
    type: [String],
  })
  @IsUUID('all', { each: true })
  @IsOptional()
  employeUuids?: string[];
}
