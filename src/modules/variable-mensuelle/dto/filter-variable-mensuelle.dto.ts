import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FilterVariableMensuelleDto {
  @ApiProperty({ required: false, description: 'Filtrer par employé' })
  @IsUUID()
  @IsOptional()
  employeUuid?: string;

  @ApiProperty({ required: false, description: 'Filtrer par rubrique' })
  @IsUUID()
  @IsOptional()
  rubriqueUuid?: string;

  @ApiProperty({ required: false, description: 'Filtrer par période' })
  @IsUUID()
  @IsOptional()
  periodeUuid?: string;
}
