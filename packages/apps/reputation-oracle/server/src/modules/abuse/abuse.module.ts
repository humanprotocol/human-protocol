import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AbuseSlackBot } from './abuse-slack-bot';
import { AbuseRepository } from './abuse.repository';
import { AbuseService } from './abuse.service';
import { Web3Module } from '../web3/web3.module';
import { OutgoingWebhookModule } from '../webhook/webhook-outgoing.module';
import { AbuseController } from './abuse.controller';
import { AbuseSlackAuthGuard } from './abuse-slack-auth.guard';

@Module({
  imports: [HttpModule, Web3Module, OutgoingWebhookModule],
  providers: [
    AbuseRepository,
    AbuseService,
    AbuseSlackBot,
    AbuseSlackAuthGuard,
  ],
  exports: [AbuseService],
  controllers: [AbuseController],
})
export class AbuseModule {}
