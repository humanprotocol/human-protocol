import { Injectable, Logger } from '@nestjs/common';

import { WebhookEntity } from './webhook.entity';
import {
  Repository,
  QueryFailedError,
  DataSource,
  LessThanOrEqual,
} from 'typeorm';
import { handleQueryFailedError } from '../../database/database.error';
import { WebhookStatus } from '../../common/enums/webhook';
import { ConfigNames } from '../../common/config';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_MAX_RETRY_COUNT } from '../../common/constants';

@Injectable()
export class WebhookRepository extends Repository<WebhookEntity> {
  private readonly logger = new Logger(WebhookRepository.name);
  constructor(
    private dataSource: DataSource,
    public readonly configService: ConfigService,
  ) {
    super(WebhookEntity, dataSource.createEntityManager());
  }

  async createUnique(webhook: WebhookEntity): Promise<WebhookEntity> {
    try {
      await this.insert(webhook);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return webhook;
  }

  public async updateOne(
    id: number,
    webhook: Partial<WebhookEntity>,
  ): Promise<WebhookEntity | null> {
    try {
      const result = await super.update(id, webhook);
      console.log(webhook);

      if (result.affected && result.affected > 0) {
        return await this.findOne({ where: { id } });
      }
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return null;
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
