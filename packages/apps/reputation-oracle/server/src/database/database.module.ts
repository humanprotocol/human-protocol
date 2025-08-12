import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { DatabaseConfigService } from '@/config';
import { AbuseEntity } from '@/modules/abuse';
import { TokenEntity } from '@/modules/auth';
import { CronJobEntity } from '@/modules/cron-job';
import {
  EscrowCompletionEntity,
  EscrowPayoutsBatchEntity,
} from '@/modules/escrow-completion';
import { KycEntity } from '@/modules/kyc';
import {
  QualificationEntity,
  UserQualificationEntity,
} from '@/modules/qualification';
import { ReputationEntity } from '@/modules/reputation';
import { UserEntity, SiteKeyEntity } from '@/modules/user';
import {
  IncomingWebhookEntity,
  OutgoingWebhookEntity,
} from '@/modules/webhook';

import { TypeOrmLoggerModule, TypeOrmLoggerService } from './typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [TypeOrmLoggerModule],
      inject: [TypeOrmLoggerService, DatabaseConfigService],
      useFactory: (
        typeOrmLoggerService: TypeOrmLoggerService,
        databaseConfigService: DatabaseConfigService,
      ) => {
        const loggerOptions = databaseConfigService.logging?.split(', ');
        typeOrmLoggerService.setOptions(
          loggerOptions && loggerOptions[0] === 'all'
            ? 'all'
            : ((loggerOptions as LoggerOptions) ?? false),
        );

        return {
          name: 'default-connection',
          type: 'postgres',
          useUTC: true,

          ...(databaseConfigService.url
            ? {
                url: databaseConfigService.url,
              }
            : {
                host: databaseConfigService.host,
                port: databaseConfigService.port,
                username: databaseConfigService.user,
                password: databaseConfigService.password,
                database: databaseConfigService.database,
              }),
          ssl: databaseConfigService.ssl,

          namingStrategy: new SnakeNamingStrategy(),
          /**
           * Schema synchronization should be done
           * via manually running migrations
           */
          synchronize: false,
          migrationsRun: false,
          entities: [
            AbuseEntity,
            IncomingWebhookEntity,
            OutgoingWebhookEntity,
            EscrowCompletionEntity,
            EscrowPayoutsBatchEntity,
            ReputationEntity,
            TokenEntity,
            UserEntity,
            KycEntity,
            CronJobEntity,
            SiteKeyEntity,
            QualificationEntity,
            UserQualificationEntity,
          ],

          logging: true,
          logger: typeOrmLoggerService,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
