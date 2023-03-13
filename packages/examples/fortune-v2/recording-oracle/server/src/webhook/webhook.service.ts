import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

import { WebhookIncomingEntity } from "./webhook-incoming.entity";
import { Repository } from "typeorm";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookIncomingEntity)
    private readonly webhookIncomingEntityRepository: Repository<WebhookIncomingEntity>,
    private readonly configService: ConfigService,
  ) {}
}
