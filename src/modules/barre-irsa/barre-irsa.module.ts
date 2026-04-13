import { Module } from '@nestjs/common';
import { BarreIrsaService } from './barre-irsa.service';
import { BarreIrsaController } from './barre-irsa.controller';

@Module({
  providers: [BarreIrsaService],
  controllers: [BarreIrsaController]
})
export class BarreIrsaModule {}
