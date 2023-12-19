import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WebhookEntity } from './webhook.entity';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { ErrorWebhook } from '../../common/constants/errors';
import { CreateWebhookDto, UpdateWebhookDto } from './webhook.dto';

@Injectable()
export class WebhookRepository {
  private readonly logger = new Logger(WebhookRepository.name);

  constructor(
    @InjectRepository(WebhookEntity)
    private readonly webhookEntityRepository: Repository<WebhookEntity>,
  ) {}

  public async updateOne(
    where: FindOptionsWhere<WebhookEntity>,
    dto: Partial<UpdateWebhookDto>,
  ): Promise<WebhookEntity> {
    const webhookEntity = await this.webhookEntityRepository.findOneBy(where);

    if (!webhookEntity) {
      this.logger.log(ErrorWebhook.NotFound, WebhookRepository.name);
      throw new NotFoundException(ErrorWebhook.NotFound);
    }

    Object.assign(webhookEntity, dto);
    return webhookEntity.save();
  }

  public async findOne(
    where: FindOptionsWhere<WebhookEntity>,
    options?: FindOneOptions<WebhookEntity>,
  ): Promise<WebhookEntity> {
    const webhookEntity = await this.webhookEntityRepository.findOne({
      where,
      ...options,
    });

    if (!webhookEntity) {
      this.logger.log(ErrorWebhook.NotFound, WebhookEntity.name);
      throw new NotFoundException(ErrorWebhook.NotFound);
    }

    return webhookEntity;
  }

  public find(
    where: FindOptionsWhere<WebhookEntity>,
    options?: FindManyOptions<WebhookEntity>,
  ): Promise<WebhookEntity[]> {
    return this.webhookEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async create(
    dto: CreateWebhookDto,
  ): Promise<WebhookEntity | undefined> {
    try {
      return this.webhookEntityRepository.create(dto).save();
    } catch (e) {
      return;
    }
  }
}
