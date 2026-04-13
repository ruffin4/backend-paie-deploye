import { Module } from '@nestjs/common';
import { PeriodeService } from './periode.service';
import { PeriodeController } from './periode.controller';

@Module({
  providers: [PeriodeService],
  controllers: [PeriodeController]
})
export class PeriodeModule {}
