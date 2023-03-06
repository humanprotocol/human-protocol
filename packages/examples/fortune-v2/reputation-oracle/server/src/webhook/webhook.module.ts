import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

import { WebhookService } from "./webhook.service";
import { WebhookIncommingEntity } from "./webhook-incomming.entity";
import { WebhookController } from "./webhook.controller";
import { WebhookCron } from "./webhook.cron";
import { StorageModule } from "../storage/storage.module";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [TypeOrmModule.forFeature([WebhookIncommingEntity]), ConfigModule, StorageModule, HttpModule],
  controllers: [WebhookController],
  providers: [Logger, WebhookService, WebhookCron],
  exports: [WebhookService],
})
export class WebhookModule {}
