import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarreIrsaService } from './barre-irsa.service';
import { BarreIrsaController } from './barre-irsa.controller';
import { BarreIrsaEntity } from './entities/barre-irsa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BarreIrsaEntity])],
  controllers: [BarreIrsaController],
  providers: [BarreIrsaService],
  exports: [BarreIrsaService],
})
export class BarreIrsaModule {}
