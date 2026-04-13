import { Module } from '@nestjs/common';
import { CotisationService } from './cotisation.service';
import { CotisationController } from './cotisation.controller';

@Module({
  providers: [CotisationService],
  controllers: [CotisationController]
})
export class CotisationModule {}
