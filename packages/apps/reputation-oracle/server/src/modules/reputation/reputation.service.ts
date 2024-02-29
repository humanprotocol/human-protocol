import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainId } from '@human-protocol/sdk';
import {
  CVAT_VALIDATION_META_FILENAME,
  INITIAL_REPUTATION,
} from '../../common/constants';
import { ConfigNames } from '../../common/config';
import {
  JobRequestType,
  ReputationEntityType,
  ReputationLevel,
  SolutionError,
} from '../../common/enums';
import { ReputationRepository } from './reputation.repository';
import {
  ErrorManifest,
  ErrorReputation,
  ErrorResults,
} from '../../common/constants/errors';
import { ReputationDto } from './reputation.dto';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { EscrowClient } from '@human-protocol/sdk';
import {
  CvatAnnotationMeta,
  CvatAnnotationMetaResults,
  FortuneFinalResult,
} from '../../common/dto/result';
import { RequestAction } from './reputation.interface';
import { getRequestType } from '../../common/utils';
import { CvatManifestDto } from 'src/common/dto/manifest';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    @Inject(StorageService)
    private readonly storageService: StorageService,
    private readonly reputationRepository: ReputationRepository,
    private readonly configService: ConfigService,
    private readonly web3Service: Web3Service,
  ) {}

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
    if (!manifestUrl) {
      this.logger.log(
        ErrorManifest.ManifestUrlDoesNotExist,
        ReputationService.name,
      );
      throw new Error(ErrorManifest.ManifestUrlDoesNotExist);
    }

    const manifest = await this.storageService.download(manifestUrl);

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
        manifest: CvatManifestDto,
      ): Promise<void> => this.processCvat(chainId, escrowAddress, manifest),
    },
    [JobRequestType.IMAGE_POINTS]: {
      assessWorkerReputationScores: async (
        chainId: ChainId,
        escrowAddress: string,
        manifest: CvatManifestDto,
      ): Promise<void> => this.processCvat(chainId, escrowAddress, manifest),
    },
  };

  private async processFortune(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<void> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const finalResultsUrl = await escrowClient.getResultsUrl(escrowAddress);
    const finalResults = await this.storageService.download(finalResultsUrl);

    if (finalResults.length === 0) {
      this.logger.log(
        ErrorResults.NoResultsHaveBeenVerified,
        ReputationService.name,
      );
      throw new Error(ErrorResults.NoResultsHaveBeenVerified);
    }

    // Assess reputation scores for workers based on the final results of a job.
    // Decreases or increases worker reputation based on the success or failure of their contributions.
    await Promise.all(
      finalResults.map(async (result: FortuneFinalResult) => {
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
    manifest: CvatManifestDto,
  ): Promise<void> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const intermediateResultsUrl =
      await escrowClient.getIntermediateResultsUrl(escrowAddress);

    const annotations: CvatAnnotationMeta = await this.storageService.download(
      `${intermediateResultsUrl}/${CVAT_VALIDATION_META_FILENAME}`,
    );

    // If annotation meta does not exist
    if (annotations && Array.isArray(annotations) && annotations.length === 0) {
      this.logger.log(
        ErrorResults.NoAnnotationsMetaFound,
        ReputationService.name,
      );
      throw new Error(ErrorResults.NoAnnotationsMetaFound);
    }

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
    const reputationEntity = await this.reputationRepository.findOne({
      address,
    });

    if (!reputationEntity) {
      this.reputationRepository.create({
        chainId,
        address,
        reputationPoints: INITIAL_REPUTATION + 1,
        type,
      });

      return;
    }

    Object.assign(reputationEntity, {
      reputationPoints: reputationEntity.reputationPoints + 1,
    });
    reputationEntity.save();
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
    const reputationEntity = await this.reputationRepository.findOne({
      address,
    });

    if (!reputationEntity) {
      this.reputationRepository.create({
        chainId,
        address,
        reputationPoints: INITIAL_REPUTATION,
        type,
      });

      return;
    }

    if (reputationEntity.reputationPoints === INITIAL_REPUTATION) {
      return;
    }

    Object.assign(reputationEntity, {
      reputationPoints: reputationEntity.reputationPoints - 1,
    });
    reputationEntity.save();
  }

  /**
   * Retrieves the reputation data for a specific entity on a given blockchain chain.
   * @param chainId The ID of the blockchain chain.
   * @param address The address of the entity.
   * @returns {Promise<ReputationDto>} A Promise containing the reputation data.
   * @throws NotFoundException if the reputation data for the entity is not found.
   */
  public async getReputation(
    chainId: ChainId,
    address: string,
  ): Promise<ReputationDto> {
    const reputationEntity = await this.reputationRepository.findOne({
      address,
      chainId,
    });

    if (!reputationEntity) {
      this.logger.log(ErrorReputation.NotFound, ReputationService.name);
      throw new NotFoundException(ErrorReputation.NotFound);
    }

    return {
      chainId: reputationEntity.chainId,
      address: reputationEntity.address,
      reputation: this.getReputationLevel(reputationEntity.reputationPoints),
    };
  }

  /**
   * Determines the reputation level based on the reputation points.
   * @param reputationPoints The reputation points of an entity.
   * @returns {ReputationLevel} The reputation level.
   */
  public getReputationLevel(reputationPoints: number): ReputationLevel {
    const reputationLevelLow = this.configService.get<number>(
      ConfigNames.REPUTATION_LEVEL_LOW,
      300,
    );

    const reputationLevelHigh = this.configService.get<number>(
      ConfigNames.REPUTATION_LEVEL_HIGH,
      700,
    );

    if (reputationPoints <= reputationLevelLow) {
      return ReputationLevel.LOW;
    }

    if (reputationPoints >= reputationLevelHigh) {
      return ReputationLevel.HIGH;
    }

    return ReputationLevel.MEDIUM;
  }

  /**
   * Retrieves reputation data for all entities on a given blockchain chain, or for a specific chain if provided.
   * @param chainId Optional. The ID of the blockchain chain.
   * @returns {Promise<ReputationDto[]>} A Promise containing an array of reputation data.
   */
  public async getAllReputations(chainId?: ChainId): Promise<ReputationDto[]> {
    const reputations = await this.reputationRepository.find({
      chainId,
    });

    return reputations.map((reputation) => ({
      chainId: reputation.chainId,
      address: reputation.address,
      reputation: this.getReputationLevel(reputation.reputationPoints),
    }));
  }
}
