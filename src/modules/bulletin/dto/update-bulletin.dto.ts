import { PartialType } from '@nestjs/swagger';
import { CreateBulletinDto } from './create-bulletin.dto';

export class UpdateBulletinDto extends PartialType(CreateBulletinDto) {}
