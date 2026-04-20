import { PartialType } from '@nestjs/swagger';
import { CreateLigneBulletinDto } from './create-ligne-bulletin.dto';

export class UpdateLigneBulletinDto extends PartialType(
  CreateLigneBulletinDto,
) {}
