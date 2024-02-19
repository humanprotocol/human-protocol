import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { WebhookService } from './webhook.service';
import { WebhookEntity } from './webhook.entity';
import { WebhookRepository } from './webhook.repository';
import { Web3Module } from '../web3/web3.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEntity]),
    ConfigModule,
    Web3Module,
    HttpModule,
  ],
  providers: [Logger, WebhookService, WebhookRepository],
  exports: [WebhookService],
})
export class WebhookModule {}
