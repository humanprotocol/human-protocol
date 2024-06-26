import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV
    ? `.env.${process.env.NODE_ENV as string}`
    : '.env',
});

export default new DataSource({
  type: 'postgres',
  url: process.env.POSTGRES_URL,
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  entities: ['dist/src/**/*.entity{ .ts,.js}'],
  synchronize: false,
  migrations: ['dist/src/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations_typeorm',
  migrationsRun: true,
  namingStrategy: new SnakeNamingStrategy(),
  ssl: process.env.POSTGRES_SSL?.toLowerCase() === 'true',
});
