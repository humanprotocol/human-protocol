import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { NS } from '../common/constant';

import { TypeOrmLoggerModule, TypeOrmLoggerService } from './typeorm';
import { LoggerOptions } from 'typeorm';
import { JobEntity } from '../modules/job/job.entity';
import { AssignmentEntity } from '../modules/assignment/assignment.entity';
import { WebhookEntity } from '../modules/webhook/webhook.entity';
import { CronJobEntity } from '../modules/cron-job/cron-job.entity';
import { DatabaseConfigService } from '../common/config/database-config.service';
import { ServerConfigService } from '../common/config/server-config.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmLoggerModule, ConfigModule],
      inject: [
        TypeOrmLoggerService,
        DatabaseConfigService,
        ServerConfigService,
      ],
      useFactory: (
        typeOrmLoggerService: TypeOrmLoggerService,
        databaseConfigService: DatabaseConfigService,
        serverConfigService: ServerConfigService,
      ) => {
        const loggerOptions = databaseConfigService.logging.split(', ');
        typeOrmLoggerService.setOptions(
          loggerOptions && loggerOptions[0] === 'all'
            ? 'all'
            : (loggerOptions as LoggerOptions) ?? false,
        );
        return {
          name: 'default',
          type: 'postgres',
          entities: [JobEntity, AssignmentEntity, WebhookEntity, CronJobEntity],
          // We are using migrations, synchronize should be set to false.
          synchronize: false,
          // Run migrations automatically,
          // you can disable this if you prefer running migration manually.
          migrationsTableName: NS,
          migrationsTransactionMode: 'each',
          namingStrategy: new SnakeNamingStrategy(),
          logging: true,
          // Allow both start:prod and start:dev to use migrations
          // __dirname is either dist or server folder, meaning either
          // the compiled js in prod or the ts in dev.
          migrations: [path.join(__dirname, '/migrations/**/*{.ts,.js}')],
          //"migrations": ["dist/migrations/*{.ts,.js}"],
          logger: typeOrmLoggerService,
          url: databaseConfigService.url,
          host: databaseConfigService.host,
          port: databaseConfigService.port,
          username: databaseConfigService.user,
          password: databaseConfigService.password,
          database: databaseConfigService.database,
          keepConnectionAlive: serverConfigService.nodeEnv === 'test',
          migrationsRun: false,
          ssl: databaseConfigService.ssl,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
