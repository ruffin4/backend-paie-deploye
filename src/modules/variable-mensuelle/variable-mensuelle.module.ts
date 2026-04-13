import { Module } from '@nestjs/common';
import { VariableMensuelleService } from './variable-mensuelle.service';
import { VariableMensuelleController } from './variable-mensuelle.controller';

@Module({
  providers: [VariableMensuelleService],
  controllers: [VariableMensuelleController]
})
export class VariableMensuelleModule {}
