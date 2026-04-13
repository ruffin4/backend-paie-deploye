import { Module } from '@nestjs/common';
import { RapportService } from './rapport.service';
import { RapportController } from './rapport.controller';

@Module({
  providers: [RapportService],
  controllers: [RapportController]
})
export class RapportModule {}
