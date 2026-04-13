import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import compression from 'compression';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prefixe API (doit être défini avant Swagger pour que la doc utilise le préfixe)
  app.setGlobalPrefix('api');

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Payroll Madagascar API')
    .setDescription('API pour la gestion des fiches de paie à Madagascar')
    .setVersion('1.0')
    .addTag('auth', 'Authentification et gestion des utilisateurs')
    .addTag('employe', 'Gestion des employés')
    .addTag('entreprise', 'Gestion des entreprises')
    .addTag('bulletin', 'Gestion des bulletins de paie')
    .addTag('cotisation', 'Gestion des cotisations')
    .addTag('calcul-irsa', "Calcul de l'IRSA")
    .addTag('barre-irsa', 'Gestion des barres IRSA')
    .addTag('ligne-bulletin', 'Lignes des bulletins')
    .addTag('ligne-calcul-irsa', 'Lignes de calcul IRSA')
    .addTag('periode', 'Gestion des périodes')
    .addTag('rapport', 'Génération de rapports')
    .addTag('rubrique', 'Gestion des rubriques')
    .addTag('variable-mensuelle', 'Variables mensuelles')
    .addTag('historique-paie', 'Historique des paies')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrez votre token JWT',
        in: 'header',
      },
      'JWT-auth', // Nom de la sécurité
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Appliquer la sécurité à tous les endpoints
  document.security = [{ 'JWT-auth': [] }];

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Garde le token après rafraîchissement
      authAction: {
        'JWT-auth': {
          name: 'JWT-auth',
          schema: {
            type: 'http',
            in: 'header',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          value: '', // L'utilisateur collera son token ici
        },
      },
    },
  });

  await app.listen(3000);
  console.log(`Application running on: http://localhost:3000/api`);
  console.log(
    `Swagger documentation available at: http://localhost:3000/api-docs`,
  );
}

void bootstrap();
