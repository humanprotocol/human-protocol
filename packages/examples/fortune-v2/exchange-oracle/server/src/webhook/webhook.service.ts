import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

import { WebhookIncommingEntity } from "./webhook-incomming.entity";
import { Repository } from "typeorm";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookIncommingEntity)
    private readonly webhookIncommingEntityRepository: Repository<WebhookIncommingEntity>,
    private readonly configService: ConfigService,
  ) {}
}
