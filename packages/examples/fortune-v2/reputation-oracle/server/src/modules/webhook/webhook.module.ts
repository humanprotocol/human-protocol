import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { WebhookService } from "./webhook.service";
import { WebhookIncomingEntity } from "./webhook-incoming.entity";
import { WebhookController } from "./webhook.controller";
import { WebhookCron } from "./webhook.cron";
import { HttpModule } from "@nestjs/axios";
import { WebhookRepository } from "./webhook.repository";

@Module({
  imports: [TypeOrmModule.forFeature([WebhookIncomingEntity]), ConfigModule, HttpModule],
  controllers: [WebhookController],
  providers: [Logger, WebhookService, WebhookRepository, WebhookCron],
  exports: [WebhookService],
})
export class WebhookModule {}
