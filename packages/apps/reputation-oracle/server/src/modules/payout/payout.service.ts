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
import { CvatManifestDto, FortuneManifestDto } from '../../common/dto/manifest';
import {
  CvatAnnotationMeta,
  FortuneFinalResult,
  ProcessingResultDto,
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
   * Performs payouts for workers based on the calculated results.
   * It retrieves the signer, builds an escrow client, calculates results,
   * and initiates bulk payouts through the escrow client.
   * @param chainId The ID of the blockchain chain.
   * @param escrowAddress The address of the escrow contract.
   * @returns {Promise<string>} URL for results.
   */
  public async executePayouts(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<string> {
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

    const manifest = await this.storageService.download(manifestUrl);

    const requestType = getRequestType(manifest);

    const { calculateResults } = this.createPayoutSpecificActions[requestType];

    const results = await calculateResults(manifest, chainId, escrowAddress);

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

    this.logger.log('Payouts STOP');

    return results.url;
  }

  public createPayoutSpecificActions: Record<JobRequestType, RequestAction> = {
    [JobRequestType.FORTUNE]: {
      calculateResults: async (
        manifest: FortuneManifestDto,
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<ProcessingResultDto> =>
        this.processFortune(manifest, chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_BOXES]: {
      calculateResults: async (
        manifest: CvatManifestDto,
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<ProcessingResultDto> =>
        this.processCvat(manifest, chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_POINTS]: {
      calculateResults: async (
        manifest: CvatManifestDto,
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<ProcessingResultDto> =>
        this.processCvat(manifest, chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      calculateResults: async (
        manifest: CvatManifestDto,
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<ProcessingResultDto> =>
        this.processCvat(manifest, chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
      calculateResults: async (
        manifest: CvatManifestDto,
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<ProcessingResultDto> =>
        this.processCvat(manifest, chainId, escrowAddress),
    },
  };

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
    const signer = this.web3Service.getSigner(chainId);

    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const intermediateResults = (await this.storageService.download(
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

    const recipients = intermediateResults
      .filter((result) => !result.error)
      .map((item) => item.workerAddress);

    const payoutAmount =
      BigInt(ethers.parseUnits(manifest.fundAmount.toString(), 'ether')) /
      BigInt(recipients.length);
    const amounts = new Array(recipients.length).fill(payoutAmount);

    return { recipients, amounts, url, hash };
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
    const signer = this.web3Service.getSigner(chainId);

    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const { url, hash } = await this.storageService.copyFileFromURLToBucket(
      escrowAddress,
      chainId,
      `${intermediateResultsUrl}/${CVAT_RESULTS_ANNOTATIONS_FILENAME}`,
    );
    const annotations: CvatAnnotationMeta = await this.storageService.download(
      `${intermediateResultsUrl}/${CVAT_VALIDATION_META_FILENAME}`,
    );

    // If annotation meta does not exist
    if (annotations && Array.isArray(annotations) && annotations.length === 0) {
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

    return { recipients, amounts, url, hash };
  }
}
