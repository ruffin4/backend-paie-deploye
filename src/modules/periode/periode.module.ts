import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeriodeService } from './periode.service';
import { PeriodeController } from './periode.controller';
import { PeriodeEntity } from './entities/periode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PeriodeEntity])], // ← Important !
  controllers: [PeriodeController],
  providers: [PeriodeService],
  exports: [PeriodeService],
})
export class PeriodeModule {}
