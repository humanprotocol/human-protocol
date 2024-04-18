import { Injectable } from '@nestjs/common';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { WebhookStatus } from '../../common/enums/webhook';
import { BaseRepository } from '../../database/base.repository';
import { WebhookEntity } from './webhook.entity';
import { ServerConfigService } from '../../common/config/server-config.service';

@Injectable()
export class WebhookRepository extends BaseRepository<WebhookEntity> {
  constructor(
    private dataSource: DataSource,
    public readonly serverConfigService: ServerConfigService,
  ) {
    super(WebhookEntity, dataSource);
  }
  public findByStatus(status: WebhookStatus): Promise<WebhookEntity[]> {
    return this.find({
      where: {
        status: status,
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }
}
