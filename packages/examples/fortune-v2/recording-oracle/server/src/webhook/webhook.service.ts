import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

import { WebhookIncomingEntity } from "./webhook-incoming.entity";
import { Repository } from "typeorm";
import { IWebhookCreateDto } from "./interfaces";
import { WebhookStatus } from "../common/decorators";
import * as errors from "../common/enums/errors";
import { getSignedData, verify } from "../common/helpers";
import { IVerifyMessage } from "../common/interfaces/encryption";
import { ISignature } from "../common/interfaces/signature";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookIncomingEntity)
    private readonly webhookIncomingEntityRepository: Repository<WebhookIncomingEntity>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {}

  public async createIncomingWebhook(dto: IWebhookCreateDto): Promise<boolean> {
    const { signature } = dto;

    const verifyData: IVerifyMessage = {
      publicKey: this.configService.get<string>("JOB_LAUNCHER_PGP_PUBLIC_KEY", ""),
      message: signature
    }

    const isVerified = await verify(verifyData);


    if (!isVerified) {
      throw new UnauthorizedException(errors.Auth.Unauthorized);
    }

    // Extract signed data from signature
    const payload: ISignature = await getSignedData(signature);

    if (!payload.escrowAddress || !payload.chainId) {
      this.logger.log(errors.Webhook.BadParams, WebhookService.name);
      throw new BadRequestException(errors.Webhook.BadParams);
    }

    try {
      const webhookEntity = await this.webhookIncomingEntityRepository
        .create({
          chainId: payload.chainId,
          escrowAddress: payload.escrowAddress,
          signature,
          status: WebhookStatus.PENDING,
          waitUntil: new Date(),
        })
        .save();

      if (!webhookEntity) {
        this.logger.log(errors.Webhook.NotCreated, WebhookService.name);
        throw new NotFoundException(errors.Webhook.NotCreated);
      }

      return true;
    } catch (e) {
      this.logger.log(errors.Webhook.NotCreated, WebhookService.name);
      return false;
    }
  }

  public async testIncommigWebhook(): Promise<number> {
    console.log(12312)
    const host = this.configService.get<string>("HOST", "localhost");
    const port = this.configService.get<string>("PORT", "5000");
    console.log(21)
    const { data } = await firstValueFrom(
      await this.httpService.post(`http://${host}:${port}/webhook`, {
        headers: { 
          'signature2': this.configService.get<string>("WEBHOOK_SIGNED_PAYLOAD")
        }
      }),
    );

    console.log(data)
    
    return 1
  }
}
