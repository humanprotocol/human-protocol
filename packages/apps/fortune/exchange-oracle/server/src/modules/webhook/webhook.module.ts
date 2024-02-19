import { Module } from '@nestjs/common';

import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { JobService } from '../job/job.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, JobService],
  exports: [WebhookService],
})
export class WebhookModule {}
