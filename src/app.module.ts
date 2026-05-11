import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeModule } from './modules/employe/employe.module';
import { PeriodeModule } from './modules/periode/periode.module';
import { RubriqueModule } from './modules/rubrique/rubrique.module';
import { VariableMensuelleModule } from './modules/variable-mensuelle/variable-mensuelle.module';
import { CotisationModule } from './modules/cotisation/cotisation.module';
import { BarreIrsaModule } from './modules/barre-irsa/barre-irsa.module';
import { BulletinModule } from './modules/bulletin/bulletin.module';
import { LigneBulletinModule } from './modules/ligne-bulletin/ligne-bulletin.module';
import { CalculIrsaModule } from './modules/calcul-irsa/calcul-irsa.module';
import { LigneCalculIrsaModule } from './modules/ligne-calcul-irsa/ligne-calcul-irsa.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    EmployeModule,
    PeriodeModule,
    RubriqueModule,
    VariableMensuelleModule,
    CotisationModule,
    BarreIrsaModule,
    BulletinModule,
    LigneBulletinModule,
    CalculIrsaModule,
    LigneCalculIrsaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
