import { Module } from '@nestjs/common';
import { LigneBulletinService } from './ligne-bulletin.service';
import { LigneBulletinController } from './ligne-bulletin.controller';

@Module({
  providers: [LigneBulletinService],
  controllers: [LigneBulletinController]
})
export class LigneBulletinModule {}
