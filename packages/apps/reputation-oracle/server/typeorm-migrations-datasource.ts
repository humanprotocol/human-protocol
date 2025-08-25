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
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations_typeorm',
  namingStrategy: new SnakeNamingStrategy(),
  entities: ['src/modules/**/*.entity.ts'],
});
