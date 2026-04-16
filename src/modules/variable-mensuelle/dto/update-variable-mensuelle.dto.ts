import { PartialType } from '@nestjs/swagger';
import { CreateVariableMensuelleDto } from './create-variable-mensuelle.dto';

export class UpdateVariableMensuelleDto extends PartialType(
  CreateVariableMensuelleDto,
) {}
