import { PartialType } from '@nestjs/swagger';
import { CreateCotisationDto } from './create-cotisation.dto';

export class UpdateCotisationDto extends PartialType(CreateCotisationDto) {}
