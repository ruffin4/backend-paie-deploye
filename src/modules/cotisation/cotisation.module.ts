import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotisationService } from './cotisation.service';
import { CotisationController } from './cotisation.controller';
import { CotisationEntity } from './entities/cotisation.entity';
import { EmployeModule } from '../employe/employe.module';
import { VariableMensuelleModule } from '../variable-mensuelle/variable-mensuelle.module';
import { RubriqueModule } from '../rubrique/rubrique.module';
import { PeriodeModule } from '../periode/periode.module';
import { BarreIrsaModule } from '../barre-irsa/barre-irsa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CotisationEntity]),
    EmployeModule, // ← Import pour EmployeService
    VariableMensuelleModule, // ← Import pour VariableMensuelleService
    RubriqueModule, // ← Import pour RubriqueService
    PeriodeModule, // ← Import pour PeriodeService
    BarreIrsaModule,
  ],
  controllers: [CotisationController],
  providers: [CotisationService],
  exports: [CotisationService],
})
export class CotisationModule {}
