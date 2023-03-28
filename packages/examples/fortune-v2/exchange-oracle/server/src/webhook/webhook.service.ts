import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { WebhookOutgoingEntity } from "./webhook-outgoing.entity";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookOutgoingEntity)
    private readonly webhookOutgoingEntityRepository: Repository<WebhookOutgoingEntity>,
    private readonly configService: ConfigService,
  ) {}
}
