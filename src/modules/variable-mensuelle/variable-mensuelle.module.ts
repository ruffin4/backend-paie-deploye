import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariableMensuelleService } from './variable-mensuelle.service';
import { VariableMensuelleController } from './variable-mensuelle.controller';
import { VariableMensuelleEntity } from './entities/variable-mensuelle.entity';
import { PeriodeModule } from '../periode/periode.module';

@Module({
  imports: [TypeOrmModule.forFeature([VariableMensuelleEntity]), PeriodeModule],
  controllers: [VariableMensuelleController],
  providers: [VariableMensuelleService],
  exports: [VariableMensuelleService],
})
export class VariableMensuelleModule {}
