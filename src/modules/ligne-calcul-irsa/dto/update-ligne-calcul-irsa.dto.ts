import { PartialType } from '@nestjs/swagger';
import { CreateLigneCalculIrsaDto } from './create-ligne-calcul-irsa.dto';

export class UpdateLigneCalculIrsaDto extends PartialType(
  CreateLigneCalculIrsaDto,
) {}
