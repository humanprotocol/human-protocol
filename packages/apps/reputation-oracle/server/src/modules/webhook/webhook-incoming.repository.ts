import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { WebhookIncomingStatus } from '../../common/enums/webhook';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { ServerConfigService } from '../../config/server-config.service';

@Injectable()
export class WebhookIncomingRepository extends BaseRepository<WebhookIncomingEntity> {
  constructor(
    dataSource: DataSource,
    private readonly serverConfigService: ServerConfigService,
  ) {
    super(WebhookIncomingEntity, dataSource);
  }

  findByStatus(
    status: WebhookIncomingStatus,
  ): Promise<WebhookIncomingEntity[]> {
    return this.find({
      where: {
        status,
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },

      order: {
        createdAt: 'ASC',
      },
    });
  }
}
