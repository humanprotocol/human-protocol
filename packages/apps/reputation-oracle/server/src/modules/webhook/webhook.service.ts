/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChainId,
  EscrowClient,
  StorageClient,
  StorageCredentials,
  StorageParams,
} from '@human-protocol/sdk';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import {
  CvatAnnotationMeta,
  CvatManifestDto,
  FortuneFinalResult,
  FortuneManifestDto,
  ImageLabelBinaryJobResults,
  ProcessingResultDto,
  WebhookIncomingDto,
} from './webhook.dto';
import {
  ErrorManifest,
  ErrorResults,
  ErrorWebhook,
} from '../../common/constants/errors';
import { WebhookRepository } from './webhook.repository';
import {
  CVAT_JOB_TYPES,
  CVAT_RESULTS_ANNOTATIONS_FILENAME,
  CVAT_VALIDATION_META_FILENAME,
  RETRIES_COUNT_THRESHOLD,
} from '../../common/constants';
import { ReputationService } from '../reputation/reputation.service';
import { BigNumber, ethers } from 'ethers';
import { Web3Service } from '../web3/web3.service';
import { ConfigNames } from '../../common/config';
import {
  EventType,
  SolutionError,
  SortDirection,
  WebhookStatus,
} from '../../common/enums';
import { JobRequestType } from '../../common/enums';
import { ReputationEntityType } from '../../common/enums';
import { copyFileFromURLToBucket } from '../../common/utils';
import { LessThanOrEqual } from 'typeorm';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  public readonly storageClient: StorageClient;
  public readonly storageParams: StorageParams;
  public readonly storageCredentials: StorageCredentials;
  public readonly bucket: string;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly webhookRepository: WebhookRepository,
    private readonly reputationService: ReputationService,
    private readonly configService: ConfigService,
  ) {
    this.storageCredentials = {
      accessKey: this.configService.get<string>(ConfigNames.S3_ACCESS_KEY)!,
      secretKey: this.configService.get<string>(ConfigNames.S3_SECRET_KEY)!,
    };

    const useSSL =
      this.configService.get<string>(ConfigNames.S3_USE_SSL) === 'true';

    this.storageParams = {
      endPoint: this.configService.get<string>(ConfigNames.S3_ENDPOINT)!,
      port: Number(this.configService.get<number>(ConfigNames.S3_PORT)!),
      useSSL,
    };

    this.bucket = this.configService.get<string>(ConfigNames.S3_BUCKET)!;

    this.storageClient = new StorageClient(
      this.storageParams,
      this.storageCredentials,
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
      if (dto.eventType !== EventType.TASK_FINISHED) {
        this.logger.log(ErrorWebhook.InvalidEventType, WebhookService.name);
        throw new BadRequestException(ErrorWebhook.InvalidEventType);
      }

      const webhookEntity = await this.webhookRepository.create({
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        status: WebhookStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
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
   * Processes a pending webhook. Validates and processes incoming data,
   * then sends payments based on the processing results.
   * @param webhookEntity The entity representing the webhook data.
   * @throws {Error} Will throw an error if processing fails at any step.
   */
  public async processPendingCronJob(): Promise<boolean> {
    const webhookEntity = await this.webhookRepository.findOne(
      {
        status: WebhookStatus.PENDING,
        retriesCount: LessThanOrEqual(RETRIES_COUNT_THRESHOLD),
        waitUntil: LessThanOrEqual(new Date()),
      },
      {
        order: {
          waitUntil: SortDirection.ASC,
        },
      },
    );

    if (!webhookEntity) return false;

    try {
      const { chainId, escrowAddress } = webhookEntity;
      const signer = this.web3Service.getSigner(chainId);
      const escrowClient = await EscrowClient.build(signer);

      const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
      if (!manifestUrl) {
        this.logger.log(
          ErrorManifest.ManifestUrlDoesNotExist,
          WebhookService.name,
        );
        throw new Error(ErrorManifest.ManifestUrlDoesNotExist);
      }

      const manifest: FortuneManifestDto | CvatManifestDto =
        await StorageClient.downloadFileFromUrl(manifestUrl);
      const intermediateResultsUrl = await this.getIntermediateResultsUrl(
        chainId,
        escrowAddress,
      );

      let results: {
        recipients: string[];
        amounts: BigNumber[];
        url: string;
        hash: string;
        checkPassed: boolean;
      };

      if (
        (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
      ) {
        results = await this.processFortune(
          manifest as FortuneManifestDto,
          intermediateResultsUrl,
        );
      } else if (
        CVAT_JOB_TYPES.includes((manifest as CvatManifestDto).annotation.type)
      ) {
        results = await this.processCvat(
          manifest as CvatManifestDto,
          intermediateResultsUrl,
        );
      } else {
        this.logger.log(
          ErrorManifest.UnsupportedManifestType,
          WebhookService.name,
        );
        throw new Error(ErrorManifest.UnsupportedManifestType);
      }

      await escrowClient.bulkPayOut(
        escrowAddress,
        results.recipients,
        results.amounts,
        results.url,
        results.hash,
      );

      await this.webhookRepository.updateOne(
        { id: webhookEntity.id },
        {
          resultsUrl: results.url,
          checkPassed: results.checkPassed,
          status: WebhookStatus.PAID,
          retriesCount: 0,
        },
      );

      return true;
    } catch (e) {
      return await this.handleWebhookError(webhookEntity, e);
    }
  }

  /**
   * Processes a FORTUNE manifest type. It validates the intermediate results, finalizes them,
   * and calculates payments for the associated workers.
   * @param manifest The FORTUNE manifest data.
   * @param intermediateResultsUrl The URL to retrieve intermediate results.
   * @returns {Promise<ProcessingResultDto>} An object containing processing results including recipients, amounts, and storage data.
   */
  public async processFortune(
    manifest: FortuneManifestDto,
    intermediateResultsUrl: string,
  ): Promise<ProcessingResultDto> {
    const intermediateResults = (await this.getIntermediateResults(
      intermediateResultsUrl,
    )) as FortuneFinalResult[];
    const [{ url, hash }] = await this.storageClient.uploadFiles(
      [intermediateResults],
      this.bucket,
    );

    const recipients = intermediateResults
      .filter((result) => !result.error)
      .map((item) => item.workerAddress);
    const payoutAmount = BigNumber.from(
      ethers.utils.parseUnits(manifest.fundAmount.toString(), 'ether'),
    ).div(recipients.length);
    const amounts = new Array(recipients.length).fill(payoutAmount);

    return { recipients, amounts, url, hash, checkPassed: true }; // Assuming checkPassed is true for this case
  }

  /**
   * Processes an IMAGE_LABEL_BINARY manifest type. It retrieves annotations, calculates payouts
   * for qualified annotators, and processes storage tasks.
   * @param manifest The CVAT manifest data.
   * @param intermediateResultsUrl The URL to retrieve intermediate results.
   * @returns {Promise<ProcessingResultDto>} Returns the processing results including recipients, amounts, and storage data.
   */
  public async processCvat(
    manifest: CvatManifestDto,
    intermediateResultsUrl: string,
  ): Promise<ProcessingResultDto> {
    const { url, hash } = await copyFileFromURLToBucket(
      `${intermediateResultsUrl}/${CVAT_RESULTS_ANNOTATIONS_FILENAME}`,
      this.bucket,
      this.storageParams,
      this.storageCredentials,
    );
    const annotations: CvatAnnotationMeta =
      await StorageClient.downloadFileFromUrl(
        `${intermediateResultsUrl}/${CVAT_VALIDATION_META_FILENAME}`,
      );

    const bountyValue = ethers.utils.parseUnits(manifest.job_bounty, 18);
    const accumulatedBounties = annotations.results.reduce((accMap, curr) => {
      if (curr.annotation_quality >= manifest.validation.min_quality) {
        const existingValue =
          accMap.get(curr.annotator_wallet_address) || BigNumber.from(0);
        accMap.set(
          curr.annotator_wallet_address,
          existingValue.add(bountyValue),
        );
      }
      return accMap;
    }, new Map<string, typeof bountyValue>());

    const recipients = [...accumulatedBounties.keys()];
    const amounts = [...accumulatedBounties.values()];

    return { recipients, amounts, url, hash, checkPassed: true }; // Assuming checkPassed is true for this case
  }

  /**
   * Handles errors that occur during webhook processing. It logs the error,
   * and based on retry count, updates the webhook status accordingly.
   * @param webhookEntity The entity representing the webhook data.
   * @param error The error object thrown during processing.
   * @returns {Promise<boolean>} Returns false indicating that an error occurred.
   */
  public async handleWebhookError(
    webhookEntity: WebhookIncomingEntity,
    error: any,
  ): Promise<boolean> {
    if (webhookEntity.retriesCount >= RETRIES_COUNT_THRESHOLD) {
      await this.webhookRepository.updateOne(
        { id: webhookEntity.id },
        { status: WebhookStatus.FAILED },
      );
    } else {
      await this.webhookRepository.updateOne(
        { id: webhookEntity.id },
        {
          retriesCount: webhookEntity.retriesCount + 1,
          waitUntil: new Date(),
        },
      );
    }

    this.logger.log(
      'An error occurred during webhook validation: ',
      error,
      WebhookService.name,
    );
    return false;
  }

  /**
   * Get the oracle intermediate results url at the escrow address.
   * @param chainId - Chain id.
   * @param escrowAddress - Escrow address for which results will be obtained.
   * @returns {Promise<any>} - Return an array of intermediate results.
   * @throws {Error} - An error object if an error occurred.
   */
  private async getIntermediateResultsUrl(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<string> {
    const signer = this.web3Service.getSigner(chainId);

    const escrowClient = await EscrowClient.build(signer);

    const url = await escrowClient.getIntermediateResultsUrl(escrowAddress);

    if (!url) {
      this.logger.log(
        ErrorResults.IntermediateResultsURLNotSet,
        WebhookService.name,
      );
      throw new Error(ErrorResults.IntermediateResultsURLNotSet);
    }

    return url;
  }

  /**
   * Get the oracle intermediate results at the escrow address.
   * @param url - Intermediate results url.
   * @returns {Promise<any>} - Return an array of intermediate results.
   * @throws {Error} - An error object if an error occurred.
   */
  private async getIntermediateResults(
    url: string,
  ): Promise<FortuneFinalResult[] | ImageLabelBinaryJobResults> {
    const intermediateResults = await StorageClient.downloadFileFromUrl(
      url,
    ).catch(() => []);

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
   * Processing a webhook of an entity with a paid status.
   * @returns {Promise<boolean>} - Return the boolean result of the method.
   * @throws {Error} - An error object if an error occurred.
   */
  public async processPaidCronJob(): Promise<boolean> {
    const webhookEntity = await this.webhookRepository.findOne(
      {
        status: WebhookStatus.PAID,
        retriesCount: LessThanOrEqual(RETRIES_COUNT_THRESHOLD),
        waitUntil: LessThanOrEqual(new Date()),
      },
      {
        order: {
          waitUntil: SortDirection.ASC,
        },
      },
    );

    if (!webhookEntity) return false;

    try {
      const signer = this.web3Service.getSigner(webhookEntity.chainId);
      const escrowClient = await EscrowClient.build(signer);

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

      const manifest: FortuneManifestDto | CvatManifestDto =
        await StorageClient.downloadFileFromUrl(manifestUrl);

      let decreaseExchangeReputation = false;
      if (
        (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
      ) {
        const finalResultsUrl = await escrowClient.getResultsUrl(
          webhookEntity.escrowAddress,
        );

        const finalResults = await StorageClient.downloadFileFromUrl(
          finalResultsUrl,
        ).catch(() => []);

        if (finalResults.length === 0) {
          this.logger.log(
            ErrorResults.NoResultsHaveBeenVerified,
            WebhookService.name,
          );
          throw new Error(ErrorResults.NoResultsHaveBeenVerified);
        }

        await Promise.all(
          finalResults.map(async (result: FortuneFinalResult) => {
            if (result.error) {
              if (result.error === SolutionError.Duplicated)
                decreaseExchangeReputation = true;
              await this.reputationService.decreaseReputation(
                webhookEntity.chainId,
                result.workerAddress,
                ReputationEntityType.WORKER,
              );
            } else {
              await this.reputationService.increaseReputation(
                webhookEntity.chainId,
                result.workerAddress,
                ReputationEntityType.WORKER,
              );
            }
          }),
        );
      }

      const jobLauncherAddress = await escrowClient.getJobLauncherAddress(
        webhookEntity.escrowAddress,
      );
      await this.reputationService.increaseReputation(
        webhookEntity.chainId,
        jobLauncherAddress,
        ReputationEntityType.JOB_LAUNCHER,
      );

      const exchangeOracleAddress = await escrowClient.getExchangeOracleAddress(
        webhookEntity.escrowAddress,
      );
      if (decreaseExchangeReputation) {
        await this.reputationService.decreaseReputation(
          webhookEntity.chainId,
          exchangeOracleAddress,
          ReputationEntityType.EXCHANGE_ORACLE,
        );
      } else {
        await this.reputationService.increaseReputation(
          webhookEntity.chainId,
          exchangeOracleAddress,
          ReputationEntityType.EXCHANGE_ORACLE,
        );
      }

      const recordingOracleAddress =
        await escrowClient.getRecordingOracleAddress(
          webhookEntity.escrowAddress,
        );
      if (webhookEntity.checkPassed) {
        this.reputationService.increaseReputation(
          webhookEntity.chainId,
          recordingOracleAddress,
          ReputationEntityType.RECORDING_ORACLE,
        );
      } else {
        this.reputationService.decreaseReputation(
          webhookEntity.chainId,
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
      return await this.handleWebhookError(webhookEntity, e);
    }
  }
}
