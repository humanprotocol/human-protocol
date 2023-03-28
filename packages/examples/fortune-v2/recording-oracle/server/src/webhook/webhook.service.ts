import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

import { WebhookIncomingEntity } from "./webhook-incoming.entity";
import { Repository } from "typeorm";
import { IWebhookIncomingCreateDto, IWebhookOutgoingCreateDto } from "./interfaces";
import { WebhookStatus } from "../common/decorators";
import * as errors from "../common/enums/errors";
import { getSignedData, sign, verify } from "../common/helpers";
import { IVerifyMessage } from "../common/interfaces/encryption";
import { ISignature } from "../common/interfaces/signature";
import { WebhookOutgoingEntity } from "./webhook-outgoing.entity";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookIncomingEntity)
    private readonly webhookIncomingEntityRepository: Repository<WebhookIncomingEntity>,
    @InjectRepository(WebhookOutgoingEntity)
    private readonly webhookOutgoingEntityRepository: Repository<WebhookOutgoingEntity>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {}

  public async createIncomingWebhook(dto: IWebhookIncomingCreateDto): Promise<boolean> {
    // TODO: Get signature from headers
    const { signature } = dto;

    const verifyData: IVerifyMessage = {
      publicKey: this.configService.get<string>("EXCHANGE_ORACLE_PGP_PUBLIC_KEY", ""),
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

  public async processIncommingWebhook(webhookIncomingEntity: WebhookIncomingEntity): Promise<boolean> {
    // TODO: https://github.com/humanprotocol/human-protocol/issues/300
    return true;
  }

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
