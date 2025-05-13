import { Injectable } from '@nestjs/common';
import { DataSource, LessThanOrEqual } from 'typeorm';

import { ServerConfigService } from '../../config';
import { BaseRepository } from '../../database';
import { OutgoingWebhookStatus } from './types';
import { OutgoingWebhookEntity } from './webhook-outgoing.entity';

@Injectable()
export class OutgoingWebhookRepository extends BaseRepository<OutgoingWebhookEntity> {
  constructor(
    dataSource: DataSource,
    private readonly serverConfigService: ServerConfigService,
  ) {
    super(OutgoingWebhookEntity, dataSource);
  }

  findByStatus(
    status: OutgoingWebhookStatus,
  ): Promise<OutgoingWebhookEntity[]> {
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
