import { Module } from '@nestjs/common';

import { EscrowCompletionModule } from '../escrow-completion/escrow-completion.module';
import { WebhookIncomingModule } from '../webhook/webhook-incoming.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';

@Module({
  imports: [
    WebhookIncomingModule,
    WebhookOutgoingModule,
    EscrowCompletionModule,
  ],
  providers: [CronJobService, CronJobRepository],
  exports: [],
})
export class CronJobModule {}
