import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { Web3Module } from '@/modules/web3';

import { OutgoingWebhookRepository } from './webhook-outgoing.repository';
import { OutgoingWebhookService } from './webhook-outgoing.service';

@Module({
  imports: [Web3Module, HttpModule],
  providers: [OutgoingWebhookService, OutgoingWebhookRepository],
  exports: [OutgoingWebhookService],
})
export class OutgoingWebhookModule {}
