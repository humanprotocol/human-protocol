import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { ReputationEntity } from '../modules/reputation/reputation.entity';
import { TokenEntity } from '../modules/auth/token.entity';
import { UserEntity } from '../modules/user/user.entity';
import { KycEntity } from '../modules/kyc/kyc.entity';
import { CronJobEntity } from '../modules/cron-job/cron-job.entity';
import { DatabaseConfigService } from '../config';
import { SiteKeyEntity } from '../modules/user/site-key.entity';
import { QualificationEntity } from '../modules/qualification/qualification.entity';
import { UserQualificationEntity } from '../modules/qualification/user-qualification.entity';
import { IncomingWebhookEntity } from '../modules/webhook/webhook-incoming.entity';
import { OutgoingWebhookEntity } from '../modules/webhook/webhook-outgoing.entity';
import { EscrowCompletionEntity } from '../modules/escrow-completion/escrow-completion.entity';
import { EscrowPayoutsBatchEntity } from '../modules/escrow-completion/escrow-payouts-batch.entity';
import { AbuseEntity } from '../modules/abuse/abuse.entity';

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
