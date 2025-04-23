import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { IncomingWebhookStatus } from '../../common/enums/webhook';
import { IncomingWebhookEntity } from './webhook-incoming.entity';
import { ServerConfigService } from '../../config/server-config.service';

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
