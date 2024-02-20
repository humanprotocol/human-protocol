import { Injectable, Logger } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { ConfigNames } from '../../common/config';
import { WebhookStatus } from '../../common/enums/webhook';
import { WebhookIncomingEntity } from './webhook-incoming.entity';

@Injectable()
export class WebhookRepository extends BaseRepository<WebhookIncomingEntity> {
  private readonly logger = new Logger(WebhookRepository.name);
  constructor(
    private dataSource: DataSource,
    public readonly configService: ConfigService,
  ) {
    super(WebhookIncomingEntity, dataSource);
  }

  public findByStatus(status: WebhookStatus): Promise<WebhookIncomingEntity[]> {
    return this.find({
      where: {
        status: status,
        retriesCount: LessThanOrEqual(
          this.configService.get(ConfigNames.MAX_RETRY_COUNT)!,
        ),
        waitUntil: LessThanOrEqual(new Date()),
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }
}
