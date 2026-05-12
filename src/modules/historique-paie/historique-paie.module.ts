import { Module } from '@nestjs/common';
import { HistoriquePaieService } from './historique-paie.service';
import { HistoriquePaieController } from './historique-paie.controller';

@Module({
  providers: [HistoriquePaieService],
  controllers: [HistoriquePaieController],
})
export class HistoriquePaieModule {}
