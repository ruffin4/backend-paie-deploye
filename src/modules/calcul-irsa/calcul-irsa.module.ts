import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculIrsaService } from './calcul-irsa.service';
import { CalculIrsaController } from './calcul-irsa.controller';
import { CalculIrsaEntity } from './entities/calcul-irsa.entity';
import { LigneCalculIrsaEntity } from '../ligne-calcul-irsa/entities/ligne-calcul-irsa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalculIrsaEntity, LigneCalculIrsaEntity]),
  ],
  controllers: [CalculIrsaController],
  providers: [CalculIrsaService],
  exports: [CalculIrsaService],
})
export class CalculIrsaModule {}
