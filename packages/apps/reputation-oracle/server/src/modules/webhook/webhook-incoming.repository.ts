import { Injectable } from '@nestjs/common';
import { DataSource, LessThanOrEqual } from 'typeorm';

import { ServerConfigService } from '@/config';
import { BaseRepository } from '@/database';
import { IncomingWebhookStatus } from './types';
import { IncomingWebhookEntity } from './webhook-incoming.entity';

@Injectable()
export class IncomingWebhookRepository extends BaseRepository<IncomingWebhookEntity> {
  constructor(
    dataSource: DataSource,
    private readonly serverConfigService: ServerConfigService,
  ) {
    super(IncomingWebhookEntity, dataSource);
  }

  findByStatus(
    status: IncomingWebhookStatus,
  ): Promise<IncomingWebhookEntity[]> {
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
