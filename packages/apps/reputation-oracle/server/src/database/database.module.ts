import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { NS } from '../common/constants';

import { TypeOrmLoggerModule, TypeOrmLoggerService } from './typeorm';
import { WebhookIncomingEntity } from '../modules/webhook/webhook-incoming.entity';
import { ReputationEntity } from '../modules/reputation/reputation.entity';
import { TokenEntity } from '../modules/auth/token.entity';
import { UserEntity } from '../modules/user/user.entity';
import { KycEntity } from '../modules/kyc/kyc.entity';
import { CronJobEntity } from '../modules/cron-job/cron-job.entity';
import { LoggerOptions } from 'typeorm';
import { DatabaseConfigService } from '../common/config/database-config.service';
import { ServerConfigService } from '../common/config/server-config.service';
import { SiteKeyEntity } from '../modules/user/site-key.entity';
import { CredentialValidationEntity } from '../modules/credentials/credential.entity';
import { CredentialEntity } from '../modules/credentials/credential.entity';

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
        const loggerOptions = databaseConfigService.logging?.split(', ');
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
            CredentialEntity,
            CredentialValidationEntity,
            TokenEntity,
            UserEntity,
            KycEntity,
            CronJobEntity,
            SiteKeyEntity,
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
