import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// Importer directement les entités (solution la plus fiable)
import { EmployeEntity } from './modules/employe/entities/employe.entity';
import { RubriqueEntity } from './modules/rubrique/entities/rubrique.entity';
import { PeriodeEntity } from './modules/periode/entities/periode.entity';
import { VariableMensuelleEntity } from './modules/variable-mensuelle/entities/variable-mensuelle.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'payroll_madagascar',
  synchronize: true,
  logging: true,
  entities: [
    EmployeEntity,
    RubriqueEntity,
    PeriodeEntity,
    VariableMensuelleEntity,
  ],
  migrations: ['src/database/migrations/**/*.ts'],
  migrationsTableName: 'migrations',
});
