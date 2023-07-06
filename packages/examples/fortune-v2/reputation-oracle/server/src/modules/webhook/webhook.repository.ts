import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WebhookIncomingEntity } from './webhook-incoming.entity';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { ErrorWebhook } from '../../common/constants/errors';
import {
  WebhookIncomingCreateDto,
  WebhookIncomingUpdateDto,
} from './webhook.dto';

@Injectable()
export class WebhookRepository {
  private readonly logger = new Logger(WebhookRepository.name);

  constructor(
    @InjectRepository(WebhookIncomingEntity)
    private readonly webhookIncomingEntityRepository: Repository<WebhookIncomingEntity>,
  ) {}

  public async updateOne(
    where: FindOptionsWhere<WebhookIncomingEntity>,
    dto: Partial<WebhookIncomingUpdateDto>,
  ): Promise<WebhookIncomingEntity> {
    const webhookIncomingEntity =
      await this.webhookIncomingEntityRepository.findOneBy(where);

    if (!webhookIncomingEntity) {
      this.logger.log(ErrorWebhook.NotFound, WebhookRepository.name);
      throw new NotFoundException(ErrorWebhook.NotFound);
    }

    Object.assign(webhookIncomingEntity, dto);
    return webhookIncomingEntity.save();
  }

  public async findOne(
    where: FindOptionsWhere<WebhookIncomingEntity>,
    options?: FindOneOptions<WebhookIncomingEntity>,
  ): Promise<WebhookIncomingEntity> {
    const webhookEntity = await this.webhookIncomingEntityRepository.findOne({
      where,
      ...options,
    });

    if (!webhookEntity) {
      this.logger.log(ErrorWebhook.NotFound, WebhookIncomingEntity.name);
      throw new NotFoundException(ErrorWebhook.NotFound);
    }

    return webhookEntity;
  }

  public find(
    where: FindOptionsWhere<WebhookIncomingEntity>,
    options?: FindManyOptions<WebhookIncomingEntity>,
  ): Promise<WebhookIncomingEntity[]> {
    return this.webhookIncomingEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async create(
    dto: WebhookIncomingCreateDto,
  ): Promise<WebhookIncomingEntity | undefined> {
    try {
      return this.webhookIncomingEntityRepository.create(dto).save();
    } catch (e) {
      return;
    }
  }
}
