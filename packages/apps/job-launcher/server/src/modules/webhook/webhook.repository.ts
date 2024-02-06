import { Injectable, Logger } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, LessThanOrEqual } from 'typeorm';
import { ConfigNames } from '../../common/config';
import { DEFAULT_MAX_RETRY_COUNT } from '../../common/constants';
import { WebhookStatus } from '../../common/enums/webhook';
import { WebhookEntity } from './webhook.entity';

@Injectable()
export class WebhookRepository extends BaseRepository<WebhookEntity> {
  private readonly logger = new Logger(WebhookRepository.name);
  constructor(
    private dataSource: DataSource,
    public readonly configService: ConfigService,
  ) {
    super(WebhookEntity, dataSource);
  }

  public findByStatus(status: WebhookStatus): Promise<WebhookEntity[]> {
    return this.find({
      where: {
        status: status,
        retriesCount: LessThanOrEqual(
          this.configService.get(
            ConfigNames.MAX_RETRY_COUNT,
            DEFAULT_MAX_RETRY_COUNT,
          ),
        ),
        waitUntil: LessThanOrEqual(new Date()),
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }
}
