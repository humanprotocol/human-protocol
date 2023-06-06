import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { EscrowClient, InitClient, NETWORKS, StorageClient, StorageCredentials, StorageParams, UploadFile, } from "@human-protocol/sdk";
import { WebhookIncomingEntity } from "./webhook-incoming.entity";
import { Repository } from "typeorm";
import { WebhookIncomingCreateDto } from "./webhook.dto";
import { ErrorWebhook } from "../../common/constants/errors";
import { WebhookRepository } from "./webhook.repository";
import { WebhookStatus } from "../../common/decorators";
import { EthersSigner, InjectSignerProvider } from "nestjs-ethers";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  public readonly storageClient: StorageClient;
  public readonly storageParams: StorageParams;
  public readonly bucket: string;

  constructor(
    @InjectSignerProvider()
    public readonly ethersSigner: EthersSigner,
    private readonly webhookRepository: WebhookRepository,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    const storageCredentials: StorageCredentials = {
      accessKey: this.configService.get<string>("S3_ACCESS_KEY", ""),
      secretKey: this.configService.get<string>("S3_SECRET_KEY", ""),
    };

    this.storageParams = {
      endPoint: this.configService.get<string>("S3_ENDPOINT", "http://127.0.0.1"),
      port: this.configService.get<number>("S3_PORT", 9000),
      useSSL: this.configService.get<boolean>("S3_USE_SSL", false),
    };

    this.bucket = this.configService.get<string>("S3_BUCKET", "recording");

    this.storageClient = new StorageClient(
      storageCredentials,
      this.storageParams
    );
  }

  public async createIncomingWebhook(dto: WebhookIncomingCreateDto): Promise<boolean> {
    try {
      const webhookEntity = await this.webhookRepository
        .create({
          chainId: dto.chainId,
          escrowAddress: dto.escrowAddress,
          status: WebhookStatus.PENDING,
          waitUntil: new Date(),
        })

      if (!webhookEntity) {
        this.logger.log(ErrorWebhook.NotCreated, WebhookService.name);
        throw new NotFoundException(ErrorWebhook.NotCreated);
      }

      return true;
    } catch (e) {
      this.logger.log(ErrorWebhook.NotCreated, WebhookService.name);
      return false;
    }
  }

  public async processPendingWebhook(webhookEntity: WebhookIncomingEntity): Promise<boolean> {
    const signer = this.ethersSigner.createWallet(this.configService.get<string>("WEB3_JOB_LAUNCHER_PRIVATE_KEY", "web3 private key"));
    const clientParams = await InitClient.getParams(signer);

    const escrowClient = new EscrowClient(clientParams);
    
    try {
      const manifestUrl = await escrowClient.getManifestUrl(webhookEntity.escrowAddress);
    
      const manifest = await StorageClient.downloadFileFromUrl(manifestUrl)
    
      return true;
    } catch (e) {
      return false;
    }
  }

}
