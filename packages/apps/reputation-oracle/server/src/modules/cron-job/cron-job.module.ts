import { Global, Module } from '@nestjs/common';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronJobEntity } from './cron-job.entity';
import { ConfigModule } from '@nestjs/config';
import { EscrowCompletionModule } from '../escrow-completion/escrow-completion.module';
import { WebhookIncomingModule } from '../webhook/webhook-incoming.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([CronJobEntity]),
    ConfigModule,
    WebhookIncomingModule,
    WebhookOutgoingModule,
    EscrowCompletionModule,
  ],
  providers: [CronJobService, CronJobRepository],
  exports: [CronJobService],
})
export class CronJobModule {}
