import { Module } from '@nestjs/common';
import { CalculIrsaService } from './calcul-irsa.service';
import { CalculIrsaController } from './calcul-irsa.controller';

@Module({
  providers: [CalculIrsaService],
  controllers: [CalculIrsaController]
})
export class CalculIrsaModule {}
