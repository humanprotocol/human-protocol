import { Module } from '@nestjs/common';

import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { JobService } from '../job/job.service';
import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [HttpModule, Web3Module, StorageModule],
  controllers: [WebhookController],
  providers: [WebhookService, JobService],
  exports: [WebhookService],
})
export class WebhookModule {}
