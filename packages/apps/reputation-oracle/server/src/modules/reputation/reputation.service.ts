import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ChainId } from '@human-protocol/sdk';
import {
  CVAT_VALIDATION_META_FILENAME,
  INITIAL_REPUTATION,
} from '../../common/constants';
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
import { CvatManifestDto } from '../../common/dto/manifest';
import { ReputationConfigService } from '../../common/config/reputation-config.service';
import { ReputationEntity } from './reputation.entity';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class ReputationService {
  constructor(
    @Inject(StorageService)
    private readonly storageService: StorageService,
    private readonly reputationRepository: ReputationRepository,
    private readonly reputationConfigService: ReputationConfigService,
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
      throw new ControlledError(
        ErrorManifest.ManifestUrlDoesNotExist,
        HttpStatus.BAD_REQUEST,
      );
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

    const reputationOracleAddress = this.web3Service.getOperatorAddress();
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
    [JobRequestType.IMAGE_BOXES_FROM_POINTS]: {
      assessWorkerReputationScores: async (
        chainId: ChainId,
        escrowAddress: string,
        manifest: CvatManifestDto,
      ): Promise<void> => this.processCvat(chainId, escrowAddress, manifest),
    },
    [JobRequestType.IMAGE_SKELETONS_FROM_BOXES]: {
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
      throw new ControlledError(
        ErrorResults.NoResultsHaveBeenVerified,
        HttpStatus.BAD_REQUEST,
      );
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
      throw new ControlledError(
        ErrorResults.NoAnnotationsMetaFound,
        HttpStatus.BAD_REQUEST,
      );
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
    const reputationEntity =
      await this.reputationRepository.findOneByAddress(address);

    if (!reputationEntity) {
      const reputationEntity = new ReputationEntity();
      reputationEntity.chainId = chainId;
      reputationEntity.address = address;
      reputationEntity.reputationPoints = INITIAL_REPUTATION + 1;
      reputationEntity.type = type;

      if (
        type === ReputationEntityType.REPUTATION_ORACLE &&
        address === this.web3Service.getOperatorAddress()
      ) {
        reputationEntity.reputationPoints =
          this.reputationConfigService.highLevel;
      }

      this.reputationRepository.createUnique(reputationEntity);
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
    const reputationEntity =
      await this.reputationRepository.findOneByAddress(address);

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
      address === this.web3Service.getOperatorAddress()
    ) {
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
    // https://github.com/humanprotocol/human-protocol/issues/1047
    if (address === this.web3Service.getOperatorAddress()) {
      return {
        chainId,
        address,
        reputation: ReputationLevel.HIGH,
      };
    }

    const reputationEntity =
      await this.reputationRepository.findOneByAddressAndChainId(
        address,
        chainId,
      );

    if (!reputationEntity) {
      throw new ControlledError(
        ErrorReputation.NotFound,
        HttpStatus.BAD_REQUEST,
      );
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
    if (reputationPoints <= this.reputationConfigService.lowLevel) {
      return ReputationLevel.LOW;
    }

    if (reputationPoints >= this.reputationConfigService.highLevel) {
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
    const reputations = await this.reputationRepository.findByChainId(chainId);

    return reputations.map((reputation) => ({
      chainId: reputation.chainId,
      address: reputation.address,
      reputation: this.getReputationLevel(reputation.reputationPoints),
    }));
  }
}
