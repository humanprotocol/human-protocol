import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { Web3Module } from '../web3/web3.module';

import { WebhookOutgoingRepository } from './webhook-outgoing.repository';
import { WebhookOutgoingService } from './webhook-outgoing.service';

@Module({
  imports: [Web3Module, HttpModule],
  providers: [WebhookOutgoingService, WebhookOutgoingRepository],
  exports: [WebhookOutgoingService],
})
export class WebhookOutgoingModule {}
