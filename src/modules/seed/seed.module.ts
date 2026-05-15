import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { RubriqueEntity } from '../rubrique/entities/rubrique.entity';
import { CotisationEntity } from '../cotisation/entities/cotisation.entity';
import { BarreIrsaEntity } from '../barre-irsa/entities/barre-irsa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RubriqueEntity,
      CotisationEntity,
      BarreIrsaEntity,
    ]),
  ],
  providers: [SeedService],
  controllers: [SeedController],
  exports: [SeedService],
})
export class SeedModule {}
