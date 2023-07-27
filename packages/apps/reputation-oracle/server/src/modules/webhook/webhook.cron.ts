import { Injectable, Logger } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WebhookRepository } from './webhook.repository';
import { RETRIES_COUNT_THRESHOLD } from '../../common/constants';
import { SortDirection } from '../../common/enums';
import { LessThanOrEqual } from 'typeorm';
import { WebhookStatus } from '../../common/enums';

@Injectable()
export class WebhookCron {
  private readonly logger = new Logger(WebhookCron.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly webhookRepository: WebhookRepository,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  public async processPendingWebhook() {
    try {
      const webhookEntity = await this.webhookRepository.findOne(
        {
          status: WebhookStatus.PENDING,
          retriesCount: LessThanOrEqual(RETRIES_COUNT_THRESHOLD),
          waitUntil: LessThanOrEqual(new Date()),
        },
        {
          order: {
            waitUntil: SortDirection.ASC,
          },
        },
      );

      if (!webhookEntity) return;

      await this.webhookService.processPendingWebhook(webhookEntity);
    } catch (e) {
      return;
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  public async processPaidWebhook() {
    try {
      const webhookEntity = await this.webhookRepository.findOne(
        {
          status: WebhookStatus.PAID,
          retriesCount: LessThanOrEqual(RETRIES_COUNT_THRESHOLD),
          waitUntil: LessThanOrEqual(new Date()),
        },
        {
          order: {
            waitUntil: SortDirection.ASC,
          },
        },
      );

      if (!webhookEntity) return;

      await this.webhookService.processPaidWebhook(webhookEntity);
    } catch (e) {
      return;
    }
  }
}
