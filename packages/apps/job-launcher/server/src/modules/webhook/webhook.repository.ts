import { Injectable } from '@nestjs/common';

import { BaseRepository } from '../../database/base.repository';
import { DataSource, In, LessThanOrEqual } from 'typeorm';
import { ServerConfigService } from '../../common/config/server-config.service';
import { EventType, WebhookStatus } from '../../common/enums/webhook';
import { WebhookEntity } from './webhook.entity';

@Injectable()
export class WebhookRepository extends BaseRepository<WebhookEntity> {
  constructor(
    dataSource: DataSource,
    readonly serverConfigService: ServerConfigService,
  ) {
    super(WebhookEntity, dataSource);
  }
  public findByStatusAndType(
    status: WebhookStatus,
    type: EventType | EventType[],
  ): Promise<WebhookEntity[]> {
    const typeClause = !Array.isArray(type) ? [type] : type;
    return this.find({
      where: {
        status: status,
        eventType: In(typeClause),
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }
}
