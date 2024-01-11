/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ChainId, EscrowClient } from '@human-protocol/sdk';
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
import { ethers } from 'ethers';
import { Web3Service } from '../web3/web3.service';
import {
  EventType,
  SolutionError,
  SortDirection,
  WebhookStatus,
} from '../../common/enums';
import { JobRequestType } from '../../common/enums';
import { ReputationEntityType } from '../../common/enums';
import { LessThanOrEqual } from 'typeorm';
import { StorageService } from '../storage/storage.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  constructor(
    private readonly web3Service: Web3Service,
    @Inject(StorageService)
    private readonly storageService: StorageService,
    private readonly webhookRepository: WebhookRepository,
    private readonly reputationService: ReputationService,
    public readonly configService: ConfigService,
  ) {}

  /**
   * Create a incoming webhook using the DTO data.
   * @param dto - Data to create an incoming webhook.
   * @returns {Promise<void>} - Return the boolean result of the method.
   * @throws {Error} - An error object if an error occurred.
   */
  public async createIncomingWebhook(dto: WebhookIncomingDto): Promise<void> {
    try {
      if (dto.eventType !== EventType.TASK_COMPLETED) {
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
  @Cron(CronExpression.EVERY_10_MINUTES)
  public async processPendingCronJob(): Promise<void> {
    this.logger.log('Pending webhooks START');
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

    if (!webhookEntity) {
      this.logger.log('Pending webhooks STOP');
      return;
    }

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
        await this.storageService.download(manifestUrl);

      let results: {
        recipients: string[];
        amounts: bigint[];
        url: string;
        hash: string;
        checkPassed: boolean;
      };

      if (
        (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
      ) {
        results = await this.processFortune(
          manifest as FortuneManifestDto,
          chainId,
          escrowAddress,
        );
      } else if (
        CVAT_JOB_TYPES.includes((manifest as CvatManifestDto).annotation.type)
      ) {
        results = await this.processCvat(
          manifest as CvatManifestDto,
          chainId,
          escrowAddress,
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
        {
          gasPrice: await this.web3Service.calculateGasPrice(chainId),
        },
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
      this.logger.log('Pending webhooks STOP');
      return;
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
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<ProcessingResultDto> {
    const intermediateResultsUrl = await this.getIntermediateResultsUrl(
      chainId,
      escrowAddress,
    );
    const intermediateResults = (await this.getIntermediateResults(
      intermediateResultsUrl,
    )) as FortuneFinalResult[];

    const validResults = intermediateResults.filter((result) => !result.error);
    if (validResults.length < manifest.submissionsRequired) {
      this.logger.error(
        ErrorResults.NotAllRequiredSolutionsHaveBeenSent,
        WebhookService.name,
      );
      throw new Error(ErrorResults.NotAllRequiredSolutionsHaveBeenSent);
    }

    const { url, hash } = await this.storageService.uploadJobSolutions(
      escrowAddress,
      chainId,
      intermediateResults,
    );

    const recipients = intermediateResults
      .filter((result) => !result.error)
      .map((item) => item.workerAddress);
    const payoutAmount =
      BigInt(ethers.parseUnits(manifest.fundAmount.toString(), 'ether')) /
      BigInt(recipients.length);
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
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<ProcessingResultDto> {
    const intermediateResultsUrl = await this.getIntermediateResultsUrl(
      chainId,
      escrowAddress,
    );
    const { url, hash } = await this.storageService.copyFileFromURLToBucket(
      `${intermediateResultsUrl}/${CVAT_RESULTS_ANNOTATIONS_FILENAME}`,
    );
    const annotations: CvatAnnotationMeta = await this.storageService.download(
      `${intermediateResultsUrl}/${CVAT_VALIDATION_META_FILENAME}`,
    );

    const bountyValue = ethers.parseUnits(manifest.job_bounty, 18);
    const accumulatedBounties = annotations.results.reduce((accMap, curr) => {
      if (curr.annotation_quality >= manifest.validation.min_quality) {
        const existingValue = accMap.get(curr.annotator_wallet_address) || 0n;
        accMap.set(curr.annotator_wallet_address, existingValue + bountyValue);
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
  ): Promise<void> {
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

    this.logger.error(
      'An error occurred during webhook validation: ',
      error,
      WebhookService.name,
    );
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
    const intermediateResults = await this.storageService
      .download(url)
      .catch(() => []);

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
  @Cron(CronExpression.EVERY_10_MINUTES)
  public async processPaidCronJob(): Promise<void> {
    this.logger.log('Paid jobs START');
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

    if (!webhookEntity) return;

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
        await this.storageService.download(manifestUrl);

      let decreaseExchangeReputation = false;
      if (
        (manifest as FortuneManifestDto).requestType === JobRequestType.FORTUNE
      ) {
        const finalResultsUrl = await escrowClient.getResultsUrl(
          webhookEntity.escrowAddress,
        );

        const finalResults =
          await this.storageService.download(finalResultsUrl);

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

      await escrowClient.complete(webhookEntity.escrowAddress, {
        gasPrice: await this.web3Service.calculateGasPrice(
          webhookEntity.chainId,
        ),
      });

      await this.webhookRepository.updateOne(
        {
          id: webhookEntity.id,
        },
        { status: WebhookStatus.COMPLETED },
      );
      this.logger.log('Paid jobs STOP');
      return;
    } catch (e) {
      return await this.handleWebhookError(webhookEntity, e);
    }
  }
}
