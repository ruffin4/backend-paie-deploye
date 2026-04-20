import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarreIrsaService } from './barre-irsa.service';
import { BarreIrsaController } from './barre-irsa.controller';
import { BarreIrsaEntity } from './entities/barre-irsa.entity';
import { CotisationModule } from '../cotisation/cotisation.module';
import { EmployeModule } from '../employe/employe.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BarreIrsaEntity]),
    forwardRef(() => CotisationModule),
    forwardRef(() => EmployeModule),
  ],
  controllers: [BarreIrsaController],
  providers: [BarreIrsaService],
  exports: [BarreIrsaService],
})
export class BarreIrsaModule {}
