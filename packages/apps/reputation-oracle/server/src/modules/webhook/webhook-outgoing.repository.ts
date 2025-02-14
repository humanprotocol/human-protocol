import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { WebhookOutgoingStatus } from '../../common/enums/webhook';
import { WebhookOutgoingEntity } from './webhook-outgoing.entity';
import { ServerConfigService } from '../../config/server-config.service';

@Injectable()
export class WebhookOutgoingRepository extends BaseRepository<WebhookOutgoingEntity> {
  constructor(
    private dataSource: DataSource,
    public readonly serverConfigService: ServerConfigService,
  ) {
    super(WebhookOutgoingEntity, dataSource);
  }

  public findByStatus(
    status: WebhookOutgoingStatus,
  ): Promise<WebhookOutgoingEntity[]> {
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
