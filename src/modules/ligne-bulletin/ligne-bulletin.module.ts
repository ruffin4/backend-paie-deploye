import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneBulletinService } from './ligne-bulletin.service';
import { LigneBulletinController } from './ligne-bulletin.controller';
import { LigneBulletinEntity } from './entities/ligne-bulletin.entity';
import { RubriqueModule } from '../rubrique/rubrique.module';

@Module({
  imports: [TypeOrmModule.forFeature([LigneBulletinEntity]), RubriqueModule],
  controllers: [LigneBulletinController],
  providers: [LigneBulletinService],
  exports: [LigneBulletinService],
})
export class LigneBulletinModule {}
