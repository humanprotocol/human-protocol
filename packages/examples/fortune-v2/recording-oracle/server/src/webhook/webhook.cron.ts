import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";
import { SortDirection } from "../common/collection";
import { WEBHOOK_RETRIES_COUNT_THRESHOLD } from "../common/constants";
import { WebhookStatus } from "../common/decorators";
import { WebhookIncomingEntity } from "./webhook-incoming.entity";
import { WebhookService } from "./webhook.service";

@Injectable()
export class WebhookCron {
  private readonly logger = new Logger(WebhookCron.name);

  constructor(
    private readonly webhookService: WebhookService,
    @InjectRepository(WebhookIncomingEntity)
    private readonly webhookIncomingEntityRepository: Repository<WebhookIncomingEntity>,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  public async pendingIncommingWebhook() {
    try {
      const webhookIncomingEntity = await this.webhookIncomingEntityRepository.findOne({
        where: {
          status: WebhookStatus.PENDING,
          retriesCount: LessThanOrEqual(WEBHOOK_RETRIES_COUNT_THRESHOLD),
          waitUntil: LessThanOrEqual(new Date())
        },
        order: {
          waitUntil: SortDirection.ASC
        },
      });

      if (!webhookIncomingEntity) return;

      await this.webhookService.processIncommingWebhook(webhookIncomingEntity);
    } catch (e) {
      return;
    }
  }
}
