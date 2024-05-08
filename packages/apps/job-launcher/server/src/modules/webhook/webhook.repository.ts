import { Injectable, Logger } from '@nestjs/common';

import { BaseRepository } from '../../database/base.repository';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { ServerConfigService } from '../../common/config/server-config.service';
import { EventType, WebhookStatus } from '../../common/enums/webhook';
import { WebhookEntity } from './webhook.entity';

@Injectable()
export class WebhookRepository extends BaseRepository<WebhookEntity> {
  private readonly logger = new Logger(WebhookRepository.name);
  constructor(
    private dataSource: DataSource,
    public readonly serverConfigService: ServerConfigService,
  ) {
    super(WebhookEntity, dataSource);
  }

  public findByStatusAndType(
    status: WebhookStatus,
    type: EventType,
  ): Promise<WebhookEntity[]> {
    return this.find({
      where: {
        status: status,
        eventType: type,
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }
}
