import { Injectable } from '@nestjs/common';
import { ChainId, EscrowClient } from '@human-protocol/sdk';

import { SortDirection } from '../../common/enums';
import { isDuplicatedError } from '../../common/errors/database';
import { ReputationConfigService } from '../../config/reputation-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';

import { Web3Service } from '../web3/web3.service';

import {
  INITIAL_REPUTATION,
  ReputationEntityType,
  ReputationLevel,
  ReputationOrderBy,
} from './constants';
import { ReputationEntity } from './reputation.entity';
import {
  ReputationRepository,
  type ExclusiveReputationCriteria,
} from './reputation.repository';

type ReputationData = {
  chainId: ChainId;
  address: string;
  level: ReputationLevel;
  role: ReputationEntityType;
};

function assertAdjustableReputationPoints(points: number) {
  if (points > 0 && Number.isInteger(points)) {
    return;
  }

  throw new Error('Adjustable reputation points must be positive integer');
}

@Injectable()
export class ReputationService {
  constructor(
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
   * Increases the reputation points of a specified entity on a given chain.
   * If the entity doesn't exist in the database - creates it first.
   */
  async increaseReputation(
    { chainId, address, type }: ExclusiveReputationCriteria,
    points: number,
  ): Promise<void> {
    assertAdjustableReputationPoints(points);

    const existingEntity = await this.reputationRepository.findExclusive({
      chainId,
      address,
      type,
    });

    if (!existingEntity) {
      let initialReputation = INITIAL_REPUTATION;
      if (
        type === ReputationEntityType.REPUTATION_ORACLE &&
        address === this.web3ConfigService.operatorAddress
      ) {
        initialReputation = this.reputationConfigService.highLevel;
      }

      const reputationEntity = new ReputationEntity();
      reputationEntity.chainId = chainId;
      reputationEntity.address = address;
      reputationEntity.type = type;
      reputationEntity.reputationPoints = initialReputation;

      try {
        await this.reputationRepository.createUnique(reputationEntity);
      } catch (error) {
        if (!isDuplicatedError(error)) {
          throw error;
        }
      }
    }

    await this.reputationRepository.increment(
      {
        chainId,
        address,
        type,
      },
      'reputationPoints',
      points,
    );
  }

  /**
   * Decreases the reputation points of a specified entity on a given chain.
   * If the entity doesn't exist in the database - creates it first.
   */
  async decreaseReputation(
    { chainId, address, type }: ExclusiveReputationCriteria,
    points: number,
  ): Promise<void> {
    assertAdjustableReputationPoints(points);

    if (
      type === ReputationEntityType.REPUTATION_ORACLE &&
      address === this.web3ConfigService.operatorAddress
    ) {
      return;
    }

    const existingEntity = await this.reputationRepository.findExclusive({
      chainId,
      address,
      type,
    });

    if (!existingEntity) {
      const reputationEntity = new ReputationEntity();
      reputationEntity.chainId = chainId;
      reputationEntity.address = address;
      reputationEntity.type = type;
      reputationEntity.reputationPoints = INITIAL_REPUTATION;

      try {
        await this.reputationRepository.createUnique(reputationEntity);
      } catch (error) {
        if (!isDuplicatedError(error)) {
          throw error;
        }
      }
    }

    await this.reputationRepository.decrement(
      {
        chainId,
        address,
        type,
      },
      'reputationPoints',
      points,
    );
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

  async assessEscrowParties(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<void> {
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);

    const [jobLauncherAddress, exchangeOracleAddress, recordingOracleAddress] =
      await Promise.all([
        escrowClient.getJobLauncherAddress(escrowAddress),
        escrowClient.getExchangeOracleAddress(escrowAddress),
        escrowClient.getRecordingOracleAddress(escrowAddress),
      ]);

    const reputationTypeToAddress = new Map([
      [ReputationEntityType.JOB_LAUNCHER, jobLauncherAddress],
      [ReputationEntityType.EXCHANGE_ORACLE, exchangeOracleAddress],
      [ReputationEntityType.RECORDING_ORACLE, recordingOracleAddress],
      [
        ReputationEntityType.REPUTATION_ORACLE,
        this.web3ConfigService.operatorAddress,
      ],
    ]);

    for (const [
      reputationEntityType,
      address,
    ] of reputationTypeToAddress.entries()) {
      await this.increaseReputation(
        { chainId, address, type: reputationEntityType },
        1,
      );
    }
  }
}
