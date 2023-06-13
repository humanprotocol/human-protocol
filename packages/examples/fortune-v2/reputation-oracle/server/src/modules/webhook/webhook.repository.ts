import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { WebhookIncomingEntity } from "./webhook-incoming.entity";
import { FindConditions, FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { ErrorWebhook } from "../../common/constants/errors";
import { WebhookIncomingCreateDto, WebhookIncomingUpdateDto } from "./webhook.dto";

@Injectable()
export class WebhookRepository {
  private readonly logger = new Logger(WebhookRepository.name);

  constructor(
    @InjectRepository(WebhookIncomingEntity)
    private readonly webhookIncomingEntityRepository: Repository<WebhookIncomingEntity>,
  ) {}

  public async updateOne(
    where: FindConditions<WebhookIncomingEntity>,
    dto: Partial<WebhookIncomingUpdateDto>,
  ): Promise<WebhookIncomingEntity> {
    const webhookIncomingEntity = await this.webhookIncomingEntityRepository.findOne(where);

    if (!webhookIncomingEntity) {
      this.logger.log(ErrorWebhook.NotFound, WebhookRepository.name);
      throw new NotFoundException(ErrorWebhook.NotFound);
    }

    Object.assign(WebhookIncomingEntity, dto);
    return webhookIncomingEntity.save();
  }

  public async findOne(
    where: FindConditions<WebhookIncomingEntity>,
    options?: FindOneOptions<WebhookIncomingEntity>,
  ): Promise<WebhookIncomingEntity> {
    const webhookIncomingEntity = await this.webhookIncomingEntityRepository.findOne({ where, ...options });

    if (!webhookIncomingEntity) {
      this.logger.log(ErrorWebhook.NotFound, WebhookRepository.name);
      throw new NotFoundException(ErrorWebhook.NotFound);
    }

    return webhookIncomingEntity;
  }
  
  public find(where: FindConditions<WebhookIncomingEntity>, options?: FindManyOptions<WebhookIncomingEntity>): Promise<WebhookIncomingEntity[]> {
    return this.webhookIncomingEntityRepository.find({
      where,
      order: {
        createdAt: "DESC",
      },
      ...options,
    });
  }

  public async create(dto: WebhookIncomingCreateDto): Promise<WebhookIncomingEntity> {
    return this.webhookIncomingEntityRepository
      .create(dto)
      .save();
  }
}
