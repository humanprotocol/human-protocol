/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ChainId, EscrowClient } from '@human-protocol/sdk';
import { ErrorManifest, ErrorResults } from '../../common/constants/errors';

import {
  CVAT_RESULTS_ANNOTATIONS_FILENAME,
  CVAT_VALIDATION_META_FILENAME,
} from '../../common/constants';
import { ethers } from 'ethers';
import { Web3Service } from '../web3/web3.service';
import { JobRequestType } from '../../common/enums';
import { StorageService } from '../storage/storage.service';
import {
  CalculatePayoutsDto,
  CvatManifestDto,
  FortuneManifestDto,
} from '../../common/dto/manifest';
import {
  CvatAnnotationMeta,
  FortuneFinalResult,
  PayoutsDataDto,
  SaveResultDto,
} from '../../common/dto/result';
import { RequestAction } from './payout.interface';
import { getRequestType } from '../../common/utils';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);
  constructor(
    @Inject(StorageService)
    private readonly storageService: StorageService,
    private readonly web3Service: Web3Service,
  ) {}

  /**
   * Saves the final calculated results to be used for worker payouts.
   * Retrieves the manifest URL and downloads the manifest data to determine
   * the request type, then invokes the appropriate payout action for that type.
   * @param chainId The blockchain chain ID.
   * @param escrowAddress The escrow contract address.
   * @returns {Promise<SaveResultDto>} The URL and hash for the stored results.
   */
  public async saveResults(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<SaveResultDto> {
    this.logger.log('Save results START');

    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
    if (!manifestUrl) {
      throw new ControlledError(
        ErrorManifest.ManifestUrlDoesNotExist,
        HttpStatus.BAD_REQUEST,
      );
    }

    const manifest =
      await this.storageService.downloadJsonLikeData(manifestUrl);

    const requestType = getRequestType(manifest);

    const { saveResults } = this.createPayoutSpecificActions[requestType];

    const results = await saveResults(chainId, escrowAddress, manifest);

    this.logger.log('Save results STOP');

    return results;
  }

  /**
   * Executes payouts to workers based on final result calculations.
   * Retrieves the manifest, calculates results, and processes bulk payouts
   * using the escrow client, providing transaction options for gas price.
   * @param chainId The blockchain chain ID.
   * @param escrowAddress The escrow contract address.
   * @param url The URL containing the final results.
   * @param hash The hash of the final results.
   * @returns {Promise<void>}
   */
  public async executePayouts(
    chainId: ChainId,
    escrowAddress: string,
    url: string,
    hash: string,
  ): Promise<void> {
    this.logger.log('Payouts START');

    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
    if (!manifestUrl) {
      throw new ControlledError(
        ErrorManifest.ManifestUrlDoesNotExist,
        HttpStatus.BAD_REQUEST,
      );
    }

    const manifest =
      await this.storageService.downloadJsonLikeData(manifestUrl);

    const requestType = getRequestType(manifest);

    const { calculatePayouts } = this.createPayoutSpecificActions[requestType];

    const data: CalculatePayoutsDto = {
      chainId,
      escrowAddress,
      finalResultsUrl: url,
    };
    const results = await calculatePayouts(manifest, data);

    await escrowClient.bulkPayOut(
      escrowAddress,
      results.recipients,
      results.amounts,
      url,
      hash,
      {
        gasPrice: await this.web3Service.calculateGasPrice(chainId),
      },
    );

    this.logger.log('Payouts STOP');
  }

  public createPayoutSpecificActions: Record<JobRequestType, RequestAction> = {
    [JobRequestType.FORTUNE]: {
      calculatePayouts: async (
        manifest: FortuneManifestDto,
        data: CalculatePayoutsDto,
      ): Promise<PayoutsDataDto> =>
        this.calculatePayoutsFortune(manifest, data.finalResultsUrl),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
        manifest: FortuneManifestDto,
      ): Promise<SaveResultDto> =>
        this.saveResultsFortune(manifest, chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_BOXES]: {
      calculatePayouts: async (
        manifest: CvatManifestDto,
        data: CalculatePayoutsDto,
      ): Promise<PayoutsDataDto> =>
        this.calculatePayoutsCvat(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> => this.saveResultsCvat(chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_POINTS]: {
      calculatePayouts: async (
        manifest: CvatManifestDto,
        data: CalculatePayoutsDto,
      ): Promise<PayoutsDataDto> =>
        this.calculatePayoutsCvat(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> => this.saveResultsCvat(chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      calculatePayouts: async (
        manifest: CvatManifestDto,
        data: CalculatePayoutsDto,
      ): Promise<PayoutsDataDto> =>
        this.calculatePayoutsCvat(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> => this.saveResultsCvat(chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
      calculatePayouts: async (
        manifest: CvatManifestDto,
        data: CalculatePayoutsDto,
      ): Promise<PayoutsDataDto> =>
        this.calculatePayoutsCvat(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> => this.saveResultsCvat(chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_POLYGONS]: {
      calculatePayouts: async (
        manifest: CvatManifestDto,
        data: CalculatePayoutsDto,
      ): Promise<PayoutsDataDto> =>
        this.calculatePayoutsCvat(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> => this.saveResultsCvat(chainId, escrowAddress),
    },
  };

  /**
   * Saves final results of a Fortune-type job, verifies intermediate results,
   * and uploads the final job solutions. Throws an error if required submissions are not met.
   * @param manifest The Fortune job manifest data.
   * @param chainId The blockchain chain ID.
   * @param escrowAddress The escrow contract address.
   * @returns {Promise<SaveResultDto>} The URL and hash for the saved results.
   */
  public async saveResultsFortune(
    manifest: FortuneManifestDto,
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<SaveResultDto> {
    const signer = this.web3Service.getSigner(chainId);

    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const intermediateResults = (await this.storageService.downloadJsonLikeData(
      intermediateResultsUrl,
    )) as FortuneFinalResult[];

    if (intermediateResults.length === 0) {
      this.logger.log(
        ErrorResults.NoIntermediateResultsFound,
        PayoutService.name,
      );
      throw new ControlledError(
        ErrorResults.NoIntermediateResultsFound,
        HttpStatus.BAD_REQUEST,
      );
    }

    const validResults = intermediateResults.filter((result) => !result.error);
    if (validResults.length < manifest.submissionsRequired) {
      throw new ControlledError(
        ErrorResults.NotAllRequiredSolutionsHaveBeenSent,
        HttpStatus.BAD_REQUEST,
      );
    }

    const { url, hash } = await this.storageService.uploadJobSolutions(
      escrowAddress,
      chainId,
      intermediateResults,
    );

    return { url, hash };
  }

  /**
   * Saves final results of a CVAT-type job, using intermediate results for annotations.
   * Retrieves intermediate results, copies files to storage, and returns the final results URL and hash.
   * @param chainId The blockchain chain ID.
   * @param escrowAddress The escrow contract address.
   * @returns {Promise<SaveResultDto>} The URL and hash for the saved results.
   */
  public async saveResultsCvat(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<SaveResultDto> {
    const signer = this.web3Service.getSigner(chainId);

    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const { url, hash } = await this.storageService.copyFileFromURLToBucket(
      escrowAddress,
      chainId,
      `${intermediateResultsUrl}/${CVAT_RESULTS_ANNOTATIONS_FILENAME}`,
    );

    return { url, hash };
  }

  /**
   * Calculates payment distributions for a Fortune-type job based on manifest data
   * and final results. Distributes rewards proportionally to qualified recipients.
   * @param manifest The Fortune manifest data.
   * @param finalResultsUrl URL of the final results for this job.
   * @returns {Promise<PayoutsDataDto>} Recipients, amounts, and relevant storage data.
   */
  public async calculatePayoutsFortune(
    manifest: FortuneManifestDto,
    finalResultsUrl: string,
  ): Promise<PayoutsDataDto> {
    const finalResults = (await this.storageService.downloadJsonLikeData(
      finalResultsUrl,
    )) as FortuneFinalResult[];

    const recipients = finalResults
      .filter((result) => !result.error)
      .map((item) => item.workerAddress);

    const payoutAmount =
      BigInt(ethers.parseUnits(manifest.fundAmount.toString(), 'ether')) /
      BigInt(recipients.length);
    const amounts = new Array(recipients.length).fill(payoutAmount);

    return { recipients, amounts };
  }

  /**
   * Calculates payment distributions for a CVAT-type job based on annotations data.
   * Verifies annotation quality, accumulates bounties, and assigns payouts to qualified annotators.
   * @param manifest The CVAT manifest data.
   * @param chainId The blockchain chain ID.
   * @param escrowAddress The escrow contract address.
   * @returns {Promise<PayoutsDataDto>} Recipients, amounts, and relevant storage data.
   */
  public async calculatePayoutsCvat(
    manifest: CvatManifestDto,
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<PayoutsDataDto> {
    const signer = this.web3Service.getSigner(chainId);

    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const annotations: CvatAnnotationMeta =
      await this.storageService.downloadJsonLikeData(
        `${intermediateResultsUrl}/${CVAT_VALIDATION_META_FILENAME}`,
      );

    // If annotation meta results does not exist
    if (
      annotations &&
      annotations.results &&
      Array.isArray(annotations.results) &&
      annotations.results.length === 0 &&
      annotations.jobs &&
      Array.isArray(annotations.jobs) &&
      annotations.jobs.length === 0
    ) {
      throw new ControlledError(
        ErrorResults.NoAnnotationsMetaFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const bountyValue = ethers.parseUnits(manifest.job_bounty, 18);
    const accumulatedBounties = annotations.jobs.reduce((accMap, job) => {
      const finalResult = annotations.results.find(
        (result) => result.id === job.final_result_id,
      );
      if (
        finalResult
        // && finalResult.annotation_quality >= manifest.validation.min_quality
      ) {
        const existingValue =
          accMap.get(finalResult.annotator_wallet_address) || 0n;
        accMap.set(
          finalResult.annotator_wallet_address,
          existingValue + bountyValue,
        );
      }
      return accMap;
    }, new Map<string, typeof bountyValue>());

    const recipients = [...accumulatedBounties.keys()];
    const amounts = [...accumulatedBounties.values()];

    return { recipients, amounts };
  }
}
