import path from 'path';

import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import Environment from './src/utils/environment';

dotenv.config({
  /**
   * First value wins if "override" option is not set
   */
  path: [`.env.${Environment.name}`, '.env'],
});

const connectionUrl = process.env.POSTGRES_URL;
const tsOrJs = path.extname(__filename).slice(1);
const migrationsPath = path.join(
  __dirname,
  `src/database/migrations/*.${tsOrJs}`,
);
const entitiesPath = path.join(__dirname, `src/modules/**/*.entity.${tsOrJs}`);

export default new DataSource({
  type: 'postgres',
  useUTC: true,
  ...(connectionUrl
    ? {
        url: connectionUrl,
      }
    : {
        host: process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_PORT),
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
      }),
  ssl: process.env.POSTGRES_SSL?.toLowerCase() === 'true',
  synchronize: false,
  migrationsRun: true,
  migrations: [migrationsPath],
  migrationsTableName: 'migrations_typeorm',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [entitiesPath],
});
