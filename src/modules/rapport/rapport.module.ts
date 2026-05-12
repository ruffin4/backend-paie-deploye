import { Module } from '@nestjs/common';
import { RapportService } from './rapport.service';
import { RapportController } from './rapport.controller';

import { BulletinModule } from '../bulletin/bulletin.module';

@Module({
  imports: [BulletinModule],
  providers: [RapportService],
  controllers: [RapportController],
})
export class RapportModule {}
