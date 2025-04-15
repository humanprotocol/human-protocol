import { Injectable } from '@nestjs/common';
import { ChainId, EscrowClient } from '@human-protocol/sdk';
import {
  AUDINO_VALIDATION_META_FILENAME,
  CVAT_VALIDATION_META_FILENAME,
  INITIAL_REPUTATION,
} from '../../common/constants';
import {
  JobRequestType,
  SolutionError,
  SortDirection,
} from '../../common/enums';
import {
  AudinoAnnotationMeta,
  AudinoAnnotationMetaResult,
  CvatAnnotationMeta,
  CvatAnnotationMetaResults,
  FortuneFinalResult,
} from '../../common/interfaces/job-result';
import {
  AudinoManifest,
  CvatManifest,
  JobManifest,
} from '../../common/interfaces/manifest';
import { ReputationConfigService } from '../../config/reputation-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';
import { getRequestType } from '../../utils/manifest';

import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';

import {
  ReputationEntityType,
  ReputationLevel,
  ReputationOrderBy,
} from './constants';
import { RequestAction } from './reputation.interface';
import { ReputationEntity } from './reputation.entity';
import { ReputationRepository } from './reputation.repository';

type ReputationData = {
  chainId: ChainId;
  address: string;
  level: ReputationLevel;
  role: ReputationEntityType;
};

@Injectable()
export class ReputationService {
  constructor(
    private readonly storageService: StorageService,
    private readonly reputationRepository: ReputationRepository,
    private readonly reputationConfigService: ReputationConfigService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly web3Service: Web3Service,
  ) {}

  /**
   * Determines the reputation level based on the reputation points
   */
  private getReputationLevel(reputationPoints: number): ReputationLevel {
    if (reputationPoints <= this.reputationConfigService.lowLevel) {
      return ReputationLevel.LOW;
    }

    if (reputationPoints >= this.reputationConfigService.highLevel) {
      return ReputationLevel.HIGH;
    }

    return ReputationLevel.MEDIUM;
  }

  /**
   * Perform reputation assessment based on the completion status of a job and its associated entities.
   * Retrieves necessary data from the escrow client, including manifest and final results URLs,
   * and delegates reputation adjustments to specialized methods.
   * @param chainId The ID of the blockchain chain.
   * @param escrowAddress The address of the escrow contract.
   * @returns {Promise<void>} A Promise indicating the completion of reputation assessment.
   */
  public async assessReputationScores(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<void> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const manifestUrl = await escrowClient.getManifestUrl(escrowAddress);

    const manifest =
      await this.storageService.downloadJsonLikeData<JobManifest>(manifestUrl);

    const requestType = getRequestType(manifest);

    const { assessWorkerReputationScores } =
      this.createReputationSpecificActions[requestType];

    // Assess reputation scores for the job launcher entity.
    // Increases the reputation score for the job launcher.
    const jobLauncherAddress =
      await escrowClient.getJobLauncherAddress(escrowAddress);
    await this.increaseReputation(
      chainId,
      jobLauncherAddress,
      ReputationEntityType.JOB_LAUNCHER,
    );

    await assessWorkerReputationScores(chainId, escrowAddress, manifest);

    // Assess reputation scores for the exchange oracle entity.
    // Decreases or increases the reputation score for the exchange oracle based on job completion.
    const exchangeOracleAddress =
      await escrowClient.getExchangeOracleAddress(escrowAddress);
    await this.increaseReputation(
      chainId,
      exchangeOracleAddress,
      ReputationEntityType.EXCHANGE_ORACLE,
    );

    // Assess reputation scores for the recording oracle entity.
    // Decreases or increases the reputation score for the recording oracle based on job completion status.
    const recordingOracleAddress =
      await escrowClient.getRecordingOracleAddress(escrowAddress);
    await this.increaseReputation(
      chainId,
      recordingOracleAddress,
      ReputationEntityType.RECORDING_ORACLE,
    );

    const reputationOracleAddress = this.web3ConfigService.operatorAddress;
    await this.increaseReputation(
      chainId,
      reputationOracleAddress,
      ReputationEntityType.REPUTATION_ORACLE,
    );
  }

  private createReputationSpecificActions: Record<
    JobRequestType,
    RequestAction
  > = {
    [JobRequestType.FORTUNE]: {
      assessWorkerReputationScores: async (
        chainId: ChainId,
        escrowAddress: string,
      ): Promise<void> => this.processFortune(chainId, escrowAddress),
    },
    [JobRequestType.IMAGE_BOXES]: {
      assessWorkerReputationScores: async (
        chainId: ChainId,
        escrowAddress: string,
        manifest: CvatManifest,
      ): Promise<void> => this.processCvat(chainId, escrowAddress, manifest),
    },
    [JobRequestType.IMAGE_POINTS]: {
      assessWorkerReputationScores: async (
        chainId: ChainId,
        escrowAddress: string,
        manifest: CvatManifest,
      ): Promise<void> => this.processCvat(chainId, escrowAddress, manifest),
    },
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      assessWorkerReputationScores: async (
        chainId: ChainId,
        escrowAddress: string,
        manifest: CvatManifest,
      ): Promise<void> => this.processCvat(chainId, escrowAddress, manifest),
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
      assessWorkerReputationScores: async (
        chainId: ChainId,
        escrowAddress: string,
        manifest: CvatManifest,
      ): Promise<void> => this.processCvat(chainId, escrowAddress, manifest),
    },
    [JobRequestType.IMAGE_POLYGONS]: {
      assessWorkerReputationScores: async (
        chainId: ChainId,
        escrowAddress: string,
        manifest: CvatManifest,
      ): Promise<void> => this.processCvat(chainId, escrowAddress, manifest),
    },
    [JobRequestType.AUDIO_TRANSCRIPTION]: {
      assessWorkerReputationScores: async (
        chainId: ChainId,
        escrowAddress: string,
        manifest: AudinoManifest,
      ): Promise<void> => this.processAudino(chainId, escrowAddress, manifest),
    },
  };

  private async processFortune(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<void> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const finalResultsUrl = await escrowClient.getResultsUrl(escrowAddress);
    const finalResults =
      await this.storageService.downloadJsonLikeData<FortuneFinalResult[]>(
        finalResultsUrl,
      );

    // Assess reputation scores for workers based on the final results of a job.
    // Decreases or increases worker reputation based on the success or failure of their contributions.
    await Promise.all(
      finalResults.map(async (result) => {
        if (result.error) {
          if (result.error === SolutionError.Duplicated)
            await this.decreaseReputation(
              chainId,
              result.workerAddress,
              ReputationEntityType.WORKER,
            );
        } else {
          await this.increaseReputation(
            chainId,
            result.workerAddress,
            ReputationEntityType.WORKER,
          );
        }
      }),
    );
  }

  private async processCvat(
    chainId: ChainId,
    escrowAddress: string,
    manifest: CvatManifest,
  ): Promise<void> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const annotations =
      await this.storageService.downloadJsonLikeData<CvatAnnotationMeta>(
        `${intermediateResultsUrl}/${CVAT_VALIDATION_META_FILENAME}`,
      );

    // Assess reputation scores for workers based on the annoation quality.
    // Decreases or increases worker reputation based on comparison annoation quality to minimum threshold.
    await Promise.all(
      annotations.results.map(async (result: CvatAnnotationMetaResults) => {
        if (result.annotation_quality < manifest.validation.min_quality) {
          await this.decreaseReputation(
            chainId,
            result.annotator_wallet_address,
            ReputationEntityType.WORKER,
          );
        } else {
          await this.increaseReputation(
            chainId,
            result.annotator_wallet_address,
            ReputationEntityType.WORKER,
          );
        }
      }),
    );
  }

  private async processAudino(
    chainId: ChainId,
    escrowAddress: string,
    manifest: AudinoManifest,
  ): Promise<void> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const annotations =
      await this.storageService.downloadJsonLikeData<AudinoAnnotationMeta>(
        `${intermediateResultsUrl}/${AUDINO_VALIDATION_META_FILENAME}`,
      );

    // Assess reputation scores for workers based on the annoation quality.
    // Decreases or increases worker reputation based on comparison annoation quality to minimum threshold.
    await Promise.all(
      annotations.results.map(async (result: AudinoAnnotationMetaResult) => {
        if (result.annotation_quality < manifest.validation.min_quality) {
          await this.decreaseReputation(
            chainId,
            result.annotator_wallet_address,
            ReputationEntityType.WORKER,
          );
        } else {
          await this.increaseReputation(
            chainId,
            result.annotator_wallet_address,
            ReputationEntityType.WORKER,
          );
        }
      }),
    );
  }

  /**
   * Increases the reputation points of a specified entity on a given blockchain chain.
   * If the entity doesn't exist in the database, it creates a new entry with initial reputation points.
   * @param chainId The ID of the blockchain chain.
   * @param address The address of the entity.
   * @param type The type of reputation entity.
   * @returns {Promise<void>} A Promise indicating the completion of reputation increase.
   */
  public async increaseReputation(
    chainId: ChainId,
    address: string,
    type: ReputationEntityType,
  ): Promise<void> {
    const reputationEntity = await this.reputationRepository.findExclusive({
      chainId,
      address,
      type,
    });

    if (!reputationEntity) {
      const reputationEntity = new ReputationEntity();
      reputationEntity.chainId = chainId;
      reputationEntity.address = address;
      reputationEntity.reputationPoints = INITIAL_REPUTATION + 1;
      reputationEntity.type = type;

      if (
        type === ReputationEntityType.REPUTATION_ORACLE &&
        address === this.web3ConfigService.operatorAddress
      ) {
        reputationEntity.reputationPoints =
          this.reputationConfigService.highLevel;
      }

      this.reputationRepository.createUnique(reputationEntity);
      return;
    }

    reputationEntity.reputationPoints += 1;

    await this.reputationRepository.updateOne(reputationEntity);
  }

  /**
   * Decreases the reputation points of a specified entity on a given blockchain chain.
   * If the entity doesn't exist in the database, it creates a new entry with initial reputation points.
   * @param chainId The ID of the blockchain chain.
   * @param address The address of the entity.
   * @param type The type of reputation entity.
   * @returns {Promise<void>} A Promise indicating the completion of reputation decrease.
   */
  public async decreaseReputation(
    chainId: ChainId,
    address: string,
    type: ReputationEntityType,
  ): Promise<void> {
    const reputationEntity = await this.reputationRepository.findExclusive({
      chainId,
      address,
      type,
    });

    if (!reputationEntity) {
      const reputationEntity = new ReputationEntity();
      reputationEntity.chainId = chainId;
      reputationEntity.address = address;
      reputationEntity.reputationPoints = INITIAL_REPUTATION;
      reputationEntity.type = type;
      this.reputationRepository.createUnique(reputationEntity);
      return;
    }

    if (
      type === ReputationEntityType.REPUTATION_ORACLE &&
      address === this.web3ConfigService.operatorAddress
    ) {
      return;
    }

    if (reputationEntity.reputationPoints === INITIAL_REPUTATION) {
      return;
    }

    reputationEntity.reputationPoints -= 1;

    await this.reputationRepository.updateOne(reputationEntity);
  }

  /**
   * Retrieves reputation data for entities on a given chain,
   * optionally filtered by different params.
   */
  async getReputations(
    filter: {
      address?: string;
      chainId?: ChainId;
      types?: ReputationEntityType[];
    },
    options?: {
      orderBy?: ReputationOrderBy;
      orderDirection?: SortDirection;
      first?: number;
      skip?: number;
    },
  ): Promise<ReputationData[]> {
    const reputations = await this.reputationRepository.findPaginated(
      filter,
      options,
    );

    return reputations.map((reputation) => ({
      chainId: reputation.chainId,
      address: reputation.address,
      role: reputation.type,
      level: this.getReputationLevel(reputation.reputationPoints),
    }));
  }
}
