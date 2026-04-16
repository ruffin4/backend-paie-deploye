import { PartialType } from '@nestjs/swagger';
import { CreateBarreIrsaDto } from './create-barre-irsa.dto';

export class UpdateBarreIrsaDto extends PartialType(CreateBarreIrsaDto) {}
