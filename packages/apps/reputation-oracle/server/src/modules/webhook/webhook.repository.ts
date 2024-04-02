import { Injectable, Logger } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { WebhookStatus } from '../../common/enums/webhook';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { ServerConfigService } from '../../common/config/server-config.service';

@Injectable()
export class WebhookRepository extends BaseRepository<WebhookIncomingEntity> {
  private readonly logger = new Logger(WebhookRepository.name);
  constructor(
    private dataSource: DataSource,
    public readonly serverConfigService: ServerConfigService,
  ) {
    super(WebhookIncomingEntity, dataSource);
  }

  public findByStatus(status: WebhookStatus): Promise<WebhookIncomingEntity[]> {
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
