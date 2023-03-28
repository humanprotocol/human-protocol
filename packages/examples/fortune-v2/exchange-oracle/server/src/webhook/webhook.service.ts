import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

import { Repository } from "typeorm";
import { IWebhookOutgoingCreateDto } from "./interfaces";
import * as errors from "../common/enums/errors";
import { WebhookOutgoingEntity } from "./webhook-outgoing.entity";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookOutgoingEntity)
    private readonly webhookOutgoingEntityRepository: Repository<WebhookOutgoingEntity>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {}

    /*
      const signedData = {
        mnemonic: this.configService.get<string>("MNEMONIC", "MNEMONIC"),
        privateKey: this.configService.get<string>("PGP_PRIVATE_KEY", "PGP_PRIVATE_KEY"),
        publicKey: this.configService.get<string>("PGP_PUBLIC_KEY", "PGP_PUBLIC_KEY"),
        message: JSON.stringify(signatureData)
      }

      const signature = await sign(signedData)
    */
    public async notifyOracle(oracleUrl: string, dto: IWebhookOutgoingCreateDto): Promise<boolean> {
      const { signature, payload } = dto;
  
      try {
        // TODO: Send signature in headers
        const { data } = await firstValueFrom(
          this.httpService.post(oracleUrl, { 
            signature
          }),
        );
  
        if (!data) {
          this.logger.log(errors.Webhook.NotSent, WebhookService.name);
          throw new NotFoundException(errors.Webhook.NotSent);
        }
  
        return true;
      } catch (e) {
        const webhookEntity = await this.webhookOutgoingEntityRepository
          .create({
            chainId: payload.chainId,
            escrowAddress: payload.escrowAddress,
            signature,
          })
          .save();
  
        if (!webhookEntity) {
          this.logger.log(errors.Webhook.NotCreated, WebhookService.name);
          throw new NotFoundException(errors.Webhook.NotCreated);
        }
  
        return false;
      }
    }
}
