import { Module } from '@nestjs/common';
import { RubriqueService } from './rubrique.service';
import { RubriqueController } from './rubrique.controller';

@Module({
  providers: [RubriqueService],
  controllers: [RubriqueController]
})
export class RubriqueModule {}
