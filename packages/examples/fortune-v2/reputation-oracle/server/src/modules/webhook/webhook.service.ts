import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChainId,
  EscrowClient,
  InitClient,
  StorageClient,
  StorageCredentials,
  StorageParams,
} from '@human-protocol/sdk';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { FortuneFinalResult, ImageLabelBinaryFinalResult, ManifestDto, WebhookIncomingDto } from './webhook.dto';
import {
  ErrorManifest,
  ErrorResults,
  ErrorWebhook,
} from '../../common/constants/errors';
import { WebhookRepository } from './webhook.repository';
import { RETRIES_COUNT_THRESHOLD } from '../../common/constants';
import { checkCurseWords } from '../../common/helpers/utils';
import { ReputationService } from '../reputation/reputation.service';
import { BigNumber } from 'ethers';
import { Web3Service } from '../web3/web3.service';
import { ConfigNames } from '../../common/config';
import { WebhookStatus } from '../../common/enums';
import { JobRequestType } from '../../common/enums';
import { ReputationEntityType } from '../../common/enums';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  public readonly storageClient: StorageClient;
  public readonly storageParams: StorageParams;
  public readonly bucket: string;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly webhookRepository: WebhookRepository,
    private readonly reputationService: ReputationService,
    private readonly configService: ConfigService,
  ) {
    const storageCredentials: StorageCredentials = {
      accessKey: this.configService.get<string>(ConfigNames.S3_ACCESS_KEY)!,
      secretKey: this.configService.get<string>(ConfigNames.S3_SECRET_KEY)!,
    };

    this.storageParams = {
      endPoint: this.configService.get<string>(ConfigNames.S3_ENDPOINT)!,
      port: Number(this.configService.get<number>(ConfigNames.S3_PORT)!),
      useSSL: Boolean(this.configService.get<boolean>(ConfigNames.S3_USE_SSL)!),
    };

    this.bucket = this.configService.get<string>(ConfigNames.S3_BUCKET)!;

    this.storageClient = new StorageClient(
      storageCredentials,
      this.storageParams,
    );
  }

  /**
   * Create a incoming webhook using the DTO data.
   * @param dto - Data to create an incoming webhook.
   * @returns {Promise<boolean>} - Return the boolean result of the method.
   * @throws {Error} - An error object if an error occurred.
   */
  public async createIncomingWebhook(
    dto: WebhookIncomingDto,
  ): Promise<boolean> {
    try {
      const webhookEntity = await this.webhookRepository.create({
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        status: WebhookStatus.PENDING,
        waitUntil: new Date(),
      });

      if (!webhookEntity) {
        this.logger.log(ErrorWebhook.NotCreated, WebhookService.name);
        throw new NotFoundException(ErrorWebhook.NotCreated);
      }

      return true;
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * Processing a webhook of an entity with a pending status.
   * @param webhookEntity - The webhook is the entity to process.
   * @returns {Promise<boolean>} - Return the boolean result of the method.
   * @throws {Error} - An error object if an error occurred.
   */
  public async processPendingWebhook(
    webhookEntity: WebhookIncomingEntity,
  ): Promise<boolean> {
    const signer = this.web3Service.getSigner(webhookEntity.chainId);

    const clientParams = await InitClient.getParams(signer);
    const escrowClient = new EscrowClient(clientParams);

    try {
      const manifestUrl = await escrowClient.getManifestUrl(
        webhookEntity.escrowAddress,
      );

      if (!manifestUrl) {
        this.logger.log(
          ErrorManifest.ManifestUrlDoesNotExist,
          WebhookService.name,
        );
        throw new Error(ErrorManifest.ManifestUrlDoesNotExist);
      }
      const manifest: ManifestDto = await StorageClient.downloadFileFromUrl(
        manifestUrl,
      );

      const intermediateResults = await this.getIntermediateResults(
        webhookEntity.chainId,
        webhookEntity.escrowAddress,
      );

      let finalResults = [];
      if (manifest.requestType === JobRequestType.FORTUNE) {
        finalResults = await this.finalizeFortuneResults(intermediateResults);
      } else if (manifest.requestType === JobRequestType.IMAGE_LABEL_BINARY) {
        finalResults = intermediateResults;
      }

      const [{ url, hash }] = await this.storageClient.uploadFiles(
        [finalResults],
        this.bucket,
      );

      await escrowClient.storeResults(webhookEntity.escrowAddress, url, hash);

      const checkPassed = intermediateResults.length <= finalResults.length;

      await this.webhookRepository.updateOne(
        {
          id: webhookEntity.id,
        },
        {
          resultsUrl: url,
          checkPassed,
          status: WebhookStatus.PAID,
          retriesCount: 0,
        },
      );

      let recipients: string[] = [];
      if (manifest.requestType === JobRequestType.FORTUNE) {
        recipients = finalResults.map((item: FortuneFinalResult) => item.workerAddress);
      } else if (manifest.requestType === JobRequestType.IMAGE_LABEL_BINARY) {
        recipients = recipients.concat(finalResults.map((item: ImageLabelBinaryFinalResult) => item.correct));
      }

      const amounts = new Array(recipients.length).fill(
        BigNumber.from(manifest.fundAmount).div(recipients.length),
      );

      await escrowClient.bulkPayOut(
        webhookEntity.escrowAddress,
        recipients,
        amounts,
        url,
        hash,
      );

      return true;
    } catch (e) {
      if (webhookEntity.retriesCount >= RETRIES_COUNT_THRESHOLD) {
        await this.webhookRepository.updateOne(
          {
            id: webhookEntity.id,
          },
          { status: WebhookStatus.FAILED },
        );
      } else {
        await this.webhookRepository.updateOne(
          {
            id: webhookEntity.id,
          },
          {
            retriesCount: webhookEntity.retriesCount + 1,
            waitUntil: new Date(),
          },
        );
      }

      this.logger.log(
        'An error occurred during webhook validation: ',
        e,
        WebhookService.name,
      );

      return false;
    }
  }

  /**
   * Get the oracle intermediate results at the escrow address.
   * @param chainId - Chain id.
   * @param escrowAddress - Escrow address for which results will be obtained.
   * @returns {Promise<any>} - Return an array of intermediate results.
   * @throws {Error} - An error object if an error occurred.
   */
  public async getIntermediateResults(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<any> {
    const signer = this.web3Service.getSigner(chainId);

    const clientParams = await InitClient.getParams(signer);
    const escrowClient = new EscrowClient(clientParams);

    const intermediateResultsUrl = await escrowClient.getResultsUrl(
      escrowAddress,
    );
    const intermediateResults =
      await StorageClient.downloadFileFromUrl(intermediateResultsUrl).catch(
        () => [],
      );

    if (intermediateResults.length === 0) {
      this.logger.log(
        ErrorResults.NoIntermediateResultsFound,
        WebhookService.name,
      );
      throw new Error(ErrorResults.NoIntermediateResultsFound);
    }

    return intermediateResults;
  }

  /**
   * Validate intermediate fortune results for curses and uniqueness and return their final version.
   * @param results - Intermediate results to be validated and finalized.
   * @returns {Promise<FortuneFinalResult[]>} - Return an array of fortune final results.
   * @throws {Error} - An error object if an error occurred.
   */
  public async finalizeFortuneResults(
    results: FortuneFinalResult[],
  ): Promise<FortuneFinalResult[]> {
    const finalResults: FortuneFinalResult[] = results.filter(
      (item) =>
        !checkCurseWords(item.solution) ||
        !results.some((result) => result.solution === item.solution),
    );

    if (finalResults.length === 0) {
      this.logger.log(
        ErrorResults.NoResultsHaveBeenVerified,
        WebhookService.name,
      );
      throw new Error(ErrorResults.NoResultsHaveBeenVerified);
    }

    return finalResults;
  }

  /**
   * Processing a webhook of an entity with a paid status.
   * @param webhookEntity - The webhook is the entity to process.
   * @returns {Promise<boolean>} - Return the boolean result of the method.
   * @throws {Error} - An error object if an error occurred.
   */
  public async processPaidWebhook(
    webhookEntity: WebhookIncomingEntity,
  ): Promise<boolean> {
    const signer = this.web3Service.getSigner(webhookEntity.chainId);
    const clientParams = await InitClient.getParams(signer);
    const escrowClient = new EscrowClient(clientParams);

    try {
      const finalResultsUrl = await escrowClient.getResultsUrl(
        webhookEntity.escrowAddress,
      );

      const finalResults =
        await StorageClient.downloadFileFromUrl(finalResultsUrl).catch(
          () => [],
        );

      if (finalResults.length === 0) {
        this.logger.log(
          ErrorResults.NoResultsHaveBeenVerified,
          WebhookService.name,
        );
        throw new Error(ErrorResults.NoResultsHaveBeenVerified);
      }

      const manifestUrl = await escrowClient.getManifestUrl(
        webhookEntity.escrowAddress,
      );

      if (!manifestUrl) {
        this.logger.log(
          ErrorManifest.ManifestUrlDoesNotExist,
          WebhookService.name,
        );
        throw new Error(ErrorManifest.ManifestUrlDoesNotExist);
      }

      const manifest: ManifestDto = await StorageClient.downloadFileFromUrl(
        manifestUrl,
      );

      if (manifest.requestType === JobRequestType.FORTUNE) {
        await Promise.all(
          finalResults.map(async (result: FortuneFinalResult) => {
            await this.reputationService.increaseReputation(
              clientParams.network.chainId,
              result.workerAddress,
              ReputationEntityType.WORKER,
            );
          }),
        );
      }

      const recordingOracleAddress =
        await escrowClient.getRecordingOracleAddress(
          webhookEntity.escrowAddress,
        );

      if (webhookEntity.checkPassed) {
        this.reputationService.increaseReputation(
          clientParams.network.chainId,
          recordingOracleAddress,
          ReputationEntityType.RECORDING_ORACLE,
        );
      } else {
        this.reputationService.decreaseReputation(
          clientParams.network.chainId,
          recordingOracleAddress,
          ReputationEntityType.RECORDING_ORACLE,
        );
      }

      await this.webhookRepository.updateOne(
        {
          id: webhookEntity.id,
        },
        { status: WebhookStatus.COMPLETED },
      );

      return true;
    } catch (e) {
      if (webhookEntity.retriesCount >= RETRIES_COUNT_THRESHOLD) {
        await this.webhookRepository.updateOne(
          {
            id: webhookEntity.id,
          },
          { status: WebhookStatus.FAILED },
        );
      } else {
        await this.webhookRepository.updateOne(
          {
            id: webhookEntity.id,
          },
          {
            retriesCount: webhookEntity.retriesCount + 1,
            waitUntil: new Date(),
          },
        );
      }

      this.logger.log(
        'An error occurred during webhook validation: ',
        e,
        WebhookService.name,
      );

      return false;
    }
  }
}
