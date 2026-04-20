import { PartialType } from '@nestjs/swagger';
import { CreateCalculIrsaDto } from './create-calcul-irsa.dto';

export class UpdateCalculIrsaDto extends PartialType(CreateCalculIrsaDto) {}
