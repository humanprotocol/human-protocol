import { Injectable, Logger } from '@nestjs/common';

import { WebhookEntity } from './webhook.entity';
import {
  Repository,
  QueryFailedError,
  DataSource,
  LessThanOrEqual,
} from 'typeorm';
import { ErrorWebhook } from '../../common/constants/errors';
import {
  DatabaseError,
  handleQueryFailedError,
} from '../../database/database.error';
import { WebhookStatus } from '../../common/enums/webhook';
import { ConfigNames } from '../../common/config';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_MAX_RETRY_COUNT } from '../../common/constants';
import { DatabaseErrorCodes } from '../../database/database.enum';

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

  public async updateOneById(
    id: number,
    webhook: Partial<WebhookEntity>,
  ): Promise<WebhookEntity> {
    const webhookEntity = await this.findOne({ where: { id: id } });

    if (!webhookEntity) {
      this.logger.log(ErrorWebhook.NotFound, WebhookRepository.name);
      throw new DatabaseError(
        ErrorWebhook.NotFound,
        DatabaseErrorCodes.EntityNotFound,
      );
    }

    Object.assign(webhookEntity, webhook);

    return webhookEntity.save();
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
