import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { NS } from '../common/constants';

import { TypeOrmLoggerModule, TypeOrmLoggerService } from './typeorm';
import { WebhookIncomingEntity } from '../modules/webhook/webhook-incoming.entity';
import { ReputationEntity } from '../modules/reputation/reputation.entity';
import { AuthEntity } from '../modules/auth/auth.entity';
import { TokenEntity } from '../modules/auth/token.entity';
import { UserEntity } from '../modules/user/user.entity';
import { KycEntity } from '../modules/kyc/kyc.entity';
import { CronJobEntity } from '../modules/cron-job/cron-job.entity';
import { LoggerOptions } from 'typeorm';
import { ConfigNames } from '../common/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmLoggerModule, ConfigModule],
      inject: [TypeOrmLoggerService, ConfigService],
      useFactory: (
        typeOrmLoggerService: TypeOrmLoggerService,
        configService: ConfigService,
      ) => {
        const loggerOptions = configService
          .get<string>(ConfigNames.POSTGRES_LOGGING)
          ?.split(', ');
        typeOrmLoggerService.setOptions(
          loggerOptions && loggerOptions[0] === 'all'
            ? 'all'
            : (loggerOptions as LoggerOptions) ?? false,
        );
        return {
          name: 'default',
          type: 'postgres',
          entities: [
            WebhookIncomingEntity,
            ReputationEntity,
            AuthEntity,
            TokenEntity,
            UserEntity,
            KycEntity,
            CronJobEntity,
          ],
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
          host: configService.get<string>(
            ConfigNames.POSTGRES_HOST,
            'localhost',
          ),
          port: configService.get<number>(ConfigNames.POSTGRES_PORT, 5432),
          username: configService.get<string>(
            ConfigNames.POSTGRES_USER,
            'operator',
          ),
          password: configService.get<string>(
            ConfigNames.POSTGRES_PASSWORD,
            'qwerty',
          ),
          database: configService.get<string>(
            ConfigNames.POSTGRES_DATABASE,
            'reputation-oracle',
          ),
          keepConnectionAlive:
            configService.get<string>(ConfigNames.NODE_ENV) === 'test',
          migrationsRun: false,
          ssl:
            configService
              .get<string>(ConfigNames.POSTGRES_SSL)
              ?.toLowerCase() === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
