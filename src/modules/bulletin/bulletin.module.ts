import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulletinService } from './bulletin.service';
import { BulletinController } from './bulletin.controller';
import { BulletinPaieEntity } from './entities/bulletin.entity';
import { EmployeModule } from '../employe/employe.module';
import { PeriodeModule } from '../periode/periode.module';
import { VariableMensuelleModule } from '../variable-mensuelle/variable-mensuelle.module';
import { RubriqueModule } from '../rubrique/rubrique.module';
import { CotisationModule } from '../cotisation/cotisation.module';
import { BarreIrsaModule } from '../barre-irsa/barre-irsa.module';
import { LigneBulletinModule } from '../ligne-bulletin/ligne-bulletin.module';
import { CalculIrsaModule } from '../calcul-irsa/calcul-irsa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BulletinPaieEntity]),
    EmployeModule,
    PeriodeModule,
    VariableMensuelleModule,
    RubriqueModule,
    CotisationModule,
    BarreIrsaModule,
    LigneBulletinModule,
    CalculIrsaModule,
  ],
  controllers: [BulletinController],
  providers: [BulletinService],
  exports: [BulletinService],
})
export class BulletinModule {}
