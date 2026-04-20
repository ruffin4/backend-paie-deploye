import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneCalculIrsaService } from './ligne-calcul-irsa.service';
import { LigneCalculIrsaController } from './ligne-calcul-irsa.controller';
import { LigneCalculIrsaEntity } from './entities/ligne-calcul-irsa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LigneCalculIrsaEntity])], // ← Important !
  controllers: [LigneCalculIrsaController],
  providers: [LigneCalculIrsaService],
  exports: [LigneCalculIrsaService],
})
export class LigneCalculIrsaModule {}
