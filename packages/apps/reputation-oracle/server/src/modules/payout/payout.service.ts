/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Inject, Injectable } from '@nestjs/common';
import { ChainId, EscrowClient } from '@human-protocol/sdk';

import {
  AUDINO_RESULTS_ANNOTATIONS_FILENAME,
  AUDINO_VALIDATION_META_FILENAME,
  CVAT_RESULTS_ANNOTATIONS_FILENAME,
  CVAT_VALIDATION_META_FILENAME,
} from '../../common/constants';
import { ethers } from 'ethers';
import { Web3Service } from '../web3/web3.service';
import { JobRequestType } from '../../common/enums';
import { StorageService } from '../storage/storage.service';
import {
  AudinoManifest,
  CvatManifest,
  FortuneManifest,
} from '../../common/interfaces/manifest';
import {
  AudinoAnnotationMeta,
  CvatAnnotationMeta,
  FortuneFinalResult,
} from '../../common/interfaces/job-result';
import {
  CalculatedPayout,
  CalculatePayoutsInput,
  RequestAction,
  SaveResultDto,
} from './payout.interface';
import { getRequestType } from '../../utils/manifest';
import { assertValidJobRequestType } from '../../utils/type-guards';
import { MissingManifestUrlError } from '../../common/errors/manifest';

@Injectable()
export class PayoutService {
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
  public async processResults(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<SaveResultDto> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
    if (!manifestUrl) {
      throw new MissingManifestUrlError(escrowAddress);
    }

    const manifest =
      await this.storageService.downloadJsonLikeData(manifestUrl);

    const requestType = getRequestType(manifest).toLowerCase();

    assertValidJobRequestType(requestType);

    const { saveResults } = this.createPayoutSpecificActions[requestType];

    const results = await saveResults(chainId, escrowAddress, manifest);

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
  public async calculatePayouts(
    chainId: ChainId,
    escrowAddress: string,
    finalResultsUrl: string,
  ): Promise<CalculatedPayout[]> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);
    if (!manifestUrl) {
      throw new MissingManifestUrlError(escrowAddress);
    }

    const manifest =
      await this.storageService.downloadJsonLikeData(manifestUrl);

    const requestType = getRequestType(manifest).toLowerCase();

    assertValidJobRequestType(requestType);

    const { calculatePayouts } = this.createPayoutSpecificActions[requestType];

    const data: CalculatePayoutsInput = {
      chainId,
      escrowAddress,
      finalResultsUrl,
    };

    return await calculatePayouts(manifest, data);
  }

  public createPayoutSpecificActions: Record<JobRequestType, RequestAction> = {
    [JobRequestType.FORTUNE]: {
      calculatePayouts: async (
        manifest: FortuneManifest,
        data: CalculatePayoutsInput,
      ): Promise<CalculatedPayout[]> =>
        this.calculatePayoutsFortune(manifest, data.finalResultsUrl),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
        manifest: FortuneManifest,
      ): Promise<SaveResultDto> =>
        this.saveResultsFortune(manifest, chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_BOXES]: {
      calculatePayouts: async (
        manifest: CvatManifest,
        data: CalculatePayoutsInput,
      ): Promise<CalculatedPayout[]> =>
        this.calculatePayoutsCvat(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> => this.saveResultsCvat(chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_POINTS]: {
      calculatePayouts: async (
        manifest: CvatManifest,
        data: CalculatePayoutsInput,
      ): Promise<CalculatedPayout[]> =>
        this.calculatePayoutsCvat(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> => this.saveResultsCvat(chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      calculatePayouts: async (
        manifest: CvatManifest,
        data: CalculatePayoutsInput,
      ): Promise<CalculatedPayout[]> =>
        this.calculatePayoutsCvat(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> => this.saveResultsCvat(chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
      calculatePayouts: async (
        manifest: CvatManifest,
        data: CalculatePayoutsInput,
      ): Promise<CalculatedPayout[]> =>
        this.calculatePayoutsCvat(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> => this.saveResultsCvat(chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_POLYGONS]: {
      calculatePayouts: async (
        manifest: CvatManifest,
        data: CalculatePayoutsInput,
      ): Promise<CalculatedPayout[]> =>
        this.calculatePayoutsCvat(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> => this.saveResultsCvat(chainId, escrowAddress),
    },
    [JobRequestType.AUDIO_TRANSCRIPTION]: {
      calculatePayouts: async (
        manifest: AudinoManifest,
        data: CalculatePayoutsInput,
      ): Promise<CalculatedPayout[]> =>
        this.calculatePayoutsAudino(manifest, data.chainId, data.escrowAddress),
      saveResults: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<SaveResultDto> =>
        this.saveResultsAudino(chainId, escrowAddress),
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
    manifest: FortuneManifest,
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
      throw new Error('No intermediate results found');
    }

    const validResults = intermediateResults.filter((result) => !result.error);
    if (validResults.length < manifest.submissionsRequired) {
      throw new Error('Not all required solutions have been sent');
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
   * @returns {Promise<CalculatedPayout[]>} Recipients, amounts, and relevant storage data.
   */
  public async calculatePayoutsFortune(
    manifest: FortuneManifest,
    finalResultsUrl: string,
  ): Promise<CalculatedPayout[]> {
    const finalResults = (await this.storageService.downloadJsonLikeData(
      finalResultsUrl,
    )) as FortuneFinalResult[];

    const recipients = finalResults
      .filter((result) => !result.error)
      .map((item) => item.workerAddress);

    const payoutAmount =
      BigInt(ethers.parseUnits(manifest.fundAmount.toString(), 'ether')) /
      BigInt(recipients.length);

    return recipients.map((recipient) => ({
      address: recipient,
      amount: payoutAmount,
    }));
  }

  /**
   * Calculates payment distributions for a CVAT-type job based on annotations data.
   * Verifies annotation quality, accumulates bounties, and assigns payouts to qualified annotators.
   * @param manifest The CVAT manifest data.
   * @param chainId The blockchain chain ID.
   * @param escrowAddress The escrow contract address.
   * @returns {Promise<CalculatedPayout[]>} Recipients, amounts, and relevant storage data.
   */
  public async calculatePayoutsCvat(
    manifest: CvatManifest,
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<CalculatedPayout[]> {
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
      throw new Error('No annotations meta found');
    }

    const jobBountyValue = ethers.parseUnits(manifest.job_bounty, 18);
    const workersBounties = new Map<string, typeof jobBountyValue>();

    for (const job of annotations.jobs) {
      const jobFinalResult = annotations.results.find(
        (result) => result.id === job.final_result_id,
      );
      if (
        jobFinalResult
        // && jobFinalResult.annotation_quality >= manifest.validation.min_quality
      ) {
        const workerAddress = jobFinalResult.annotator_wallet_address;

        const currentWorkerBounty = workersBounties.get(workerAddress) || 0n;

        workersBounties.set(
          workerAddress,
          currentWorkerBounty + jobBountyValue,
        );
      }
    }

    return Array.from(workersBounties.entries()).map(
      ([workerAddress, bountyAmount]) => ({
        address: workerAddress,
        amount: bountyAmount,
      }),
    );
  }

  /**
   * Calculates payment distributions for a Audino-type job based on annotations data.
   * Verifies annotation quality, accumulates bounties, and assigns payouts to qualified annotators.
   * @param manifest The Audino manifest data.
   * @param chainId The blockchain chain ID.
   * @param escrowAddress The escrow contract address.
   * @returns {Promise<CalculatedPayout[]>} Recipients, amounts, and relevant storage data.
   */
  public async calculatePayoutsAudino(
    manifest: AudinoManifest,
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<CalculatedPayout[]> {
    const signer = this.web3Service.getSigner(chainId);

    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const annotations: AudinoAnnotationMeta =
      await this.storageService.downloadJsonLikeData(
        `${intermediateResultsUrl}/${AUDINO_VALIDATION_META_FILENAME}`,
      );

    if (
      Array.isArray(annotations?.results) &&
      annotations.results.length === 0 &&
      Array.isArray(annotations?.jobs) &&
      annotations.jobs.length === 0
    ) {
      throw new Error('No annotations meta found');
    }

    const jobBountyValue = ethers.parseUnits(manifest.job_bounty, 18);
    const workersBounties = new Map<string, typeof jobBountyValue>();

    for (const job of annotations.jobs) {
      const jobFinalResult = annotations.results.find(
        (result) => result.id === job.final_result_id,
      );
      if (
        jobFinalResult
        // && jobFinalResult.annotation_quality >= manifest.validation.min_quality
      ) {
        const workerAddress = jobFinalResult.annotator_wallet_address;

        const currentWorkerBounty = workersBounties.get(workerAddress) || 0n;

        workersBounties.set(
          workerAddress,
          currentWorkerBounty + jobBountyValue,
        );
      }
    }

    return Array.from(workersBounties.entries()).map(
      ([workerAddress, bountyAmount]) => ({
        address: workerAddress,
        amount: bountyAmount,
      }),
    );
  }

  /**
   * Saves final results of a Audino-type job, using intermediate results for annotations.
   * Retrieves intermediate results, copies files to storage, and returns the final results URL and hash.
   * @param chainId The blockchain chain ID.
   * @param escrowAddress The escrow contract address.
   * @returns {Promise<SaveResultDto>} The URL and hash for the saved results.
   */
  public async saveResultsAudino(
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
      `${intermediateResultsUrl}/${AUDINO_RESULTS_ANNOTATIONS_FILENAME}`,
    );

    return { url, hash };
  }
}
