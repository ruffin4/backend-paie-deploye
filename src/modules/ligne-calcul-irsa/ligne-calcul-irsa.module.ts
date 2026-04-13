import { Module } from '@nestjs/common';
import { LigneCalculIrsaService } from './ligne-calcul-irsa.service';
import { LigneCalculIrsaController } from './ligne-calcul-irsa.controller';

@Module({
  providers: [LigneCalculIrsaService],
  controllers: [LigneCalculIrsaController]
})
export class LigneCalculIrsaModule {}
