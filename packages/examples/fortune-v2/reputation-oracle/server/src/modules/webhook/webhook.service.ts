import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { EscrowClient, InitClient, StorageClient, StorageCredentials, StorageParams } from "@human-protocol/sdk";
import { WebhookIncomingEntity } from "./webhook-incoming.entity";
import { Repository } from "typeorm";
import { FinalResult, ManifestDto, VerifiedResult, WebhookIncomingCreateDto } from "./webhook.dto";
import { ErrorResults, ErrorWebhook } from "../../common/constants/errors";
import { WebhookRepository } from "./webhook.repository";
import { WebhookStatus } from "../../common/decorators";
import { EthersSigner, InjectSignerProvider } from "nestjs-ethers";
import { JobRequestType } from "../../common/enums/job";
import { RETRIES_COUNT_THRESHOLD } from "../../common/constants";
import { checkCurseWords } from "../../common/helpers/utils";
import { ReputationService } from "../reputation/reputation.service";

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
    private readonly reputationService: ReputationService,
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

    this.bucket = this.configService.get<string>("S3_BUCKET", "launcher");

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
      const manifest: ManifestDto = await StorageClient.downloadFileFromUrl(manifestUrl)
    
      if (manifest.requestType === JobRequestType.FORTUNE) {
        await this.validateFortune(webhookEntity, manifest);
      } else if (manifest.requestType === JobRequestType.IMAGE_LABEL_BINARY) {
        // TODO: Implement CVAT job processing
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  public async processPaidWebhook(webhookEntity: WebhookIncomingEntity): Promise<boolean> {
    const signer = this.ethersSigner.createWallet(this.configService.get<string>("WEB3_JOB_LAUNCHER_PRIVATE_KEY", "web3 private key"));
    const clientParams = await InitClient.getParams(signer);
    const escrowClient = new EscrowClient(clientParams);

    try {
      const finalResultsUrl = await escrowClient.getResultsUrl(webhookEntity.escrowAddress);
      const finalResults: FinalResult[] = await StorageClient.downloadFileFromUrl(finalResultsUrl).catch(() => []);
      if (finalResults.length === 0) {
        this.logger.log(ErrorResults.NoResultsHaveBeenVerified, WebhookService.name);
        throw new Error(ErrorResults.NoResultsHaveBeenVerified);
      }

      await Promise.all(finalResults.map(async (result) => {
        await this.reputationService.increaseReputation(result.workerAddress);
      }));

      const recordingOracleAddress = await escrowClient.getRecordingOracleAddress(webhookEntity.escrowAddress);

      if (webhookEntity.checkPassed) {
        this.reputationService.increaseReputation(recordingOracleAddress);
      } else {
        this.reputationService.decreaseReputation(recordingOracleAddress);
      }

      await this.webhookRepository
        .updateOne({
          id: webhookEntity.id,
        }, { status: WebhookStatus.COMPLETED })

      return true;
    } catch (e) {
      if (webhookEntity.retriesCount >= RETRIES_COUNT_THRESHOLD) {
        await this.webhookRepository
          .updateOne({
            id: webhookEntity.id,
          }, { status: WebhookStatus.FAILED })
      } else {
        await this.webhookRepository
          .updateOne({
            id: webhookEntity.id,
          }, { retriesCount: webhookEntity.retriesCount + 1, waitUntil: new Date() })
      }

      this.logger.log("An error occurred during webhook validation: ", e, WebhookService.name)

      return false;
    }
  }

  public async validateFortune(webhookEntity: WebhookIncomingEntity, manifest: ManifestDto): Promise<boolean> {  
    const signer = this.ethersSigner.createWallet(this.configService.get<string>("WEB3_JOB_LAUNCHER_PRIVATE_KEY", "web3 private key"));
    const clientParams = await InitClient.getParams(signer);
    const escrowClient = new EscrowClient(clientParams)
      
    try {
      const recordingOracleResultsUrl = await escrowClient.getResultsUrl(webhookEntity.escrowAddress);
      const recordingOracleResults: FinalResult[] = await StorageClient.downloadFileFromUrl(recordingOracleResultsUrl).catch(() => []);

      if (recordingOracleResults.length === 0) {
        this.logger.log(ErrorResults.NoRecordingOracleResultsFound, WebhookService.name);
        throw new Error(ErrorResults.NoRecordingOracleResultsFound);
      }

      const finalResults: FinalResult[] = recordingOracleResults.filter(item => checkCurseWords(item.solution) || !finalResults.some(result => result.solution === item.solution));
      if (finalResults.length === 0) {
        this.logger.log(ErrorResults.NoResultsHaveBeenVerified, WebhookService.name);
        throw new Error(ErrorResults.NoResultsHaveBeenVerified);
      }

      const [uploadedResult] = await this.storageClient.uploadFiles([finalResults], this.bucket);

      const finalResultsUrl = uploadedResult.key;
      const finalResultsHash = uploadedResult.hash

      await escrowClient.storeResults(webhookEntity.escrowAddress, finalResultsUrl, finalResultsHash);

      const checkPassed = recordingOracleResults.length <= finalResults.length;

      await this.webhookRepository
        .updateOne({
          id: webhookEntity.id,
        }, { 
          resultsUrl: finalResultsUrl,
          checkPassed,
          status: WebhookStatus.PAID,
          retriesCount: 0
        })
      
      const recipients = finalResults.map(item => item.workerAddress);
      const amounts = new Array(recipients.length).fill(manifest.price / recipients.length);
  
      await escrowClient.bulkPayOut(webhookEntity.escrowAddress, recipients, amounts, finalResultsUrl, finalResultsHash)
      return true;
    } catch (e) {
      if (webhookEntity.retriesCount >= RETRIES_COUNT_THRESHOLD) {
        await this.webhookRepository
          .updateOne({
            id: webhookEntity.id,
          }, { status: WebhookStatus.FAILED })
      } else {
        await this.webhookRepository
          .updateOne({
            id: webhookEntity.id,
          }, { retriesCount: webhookEntity.retriesCount + 1, waitUntil: new Date() })
      }

      this.logger.log("An error occurred during webhook validation: ", e, WebhookService.name)

      return false;
    }
  }
}
