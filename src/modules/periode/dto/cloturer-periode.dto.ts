import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloturerPeriodeDto {
  @ApiProperty({
    required: false,
    description: 'Date de clôture (par défaut: date du jour)',
  })
  @IsDateString()
  @IsOptional()
  dateCloture?: string;
}
