import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { getDatabaseConfig } from './config/database.config';
import { EmployeModule } from './modules/employe/employe.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { EntrepriseModule } from './modules/entreprise/entreprise.module';
import { BulletinModule } from './modules/bulletin/bulletin.module';
import { CotisationModule } from './modules/cotisation/cotisation.module';
import { HistoriquePaieModule } from './modules/historique-paie/historique-paie.module';
import { LigneBulletinModule } from './modules/ligne-bulletin/ligne-bulletin.module';
import { LigneCalculIrsaModule } from './modules/ligne-calcul-irsa/ligne-calcul-irsa.module';
import { PeriodeModule } from './modules/periode/periode.module';
import { RapportModule } from './modules/rapport/rapport.module';
import { RubriqueModule } from './modules/rubrique/rubrique.module';
import { VariableMensuelleModule } from './modules/variable-mensuelle/variable-mensuelle.module';
import { BarreIrsaModule } from './modules/barre-irsa/barre-irsa.module';
import { CalculIrsaModule } from './modules/calcul-irsa/calcul-irsa.module';

@Module({
  controllers: [AppController],
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
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    EmployeModule,
    AuthModule,
    EntrepriseModule,
    BulletinModule,
    CotisationModule,
    HistoriquePaieModule,
    LigneBulletinModule,
    LigneCalculIrsaModule,
    PeriodeModule,
    RapportModule,
    RubriqueModule,
    VariableMensuelleModule,
    BarreIrsaModule,
    CalculIrsaModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
