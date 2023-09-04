import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChainId } from '@human-protocol/sdk';
import { INITIAL_REPUTATION } from '../../common/constants';
import { ConfigNames } from '../../common/config';
import { ReputationEntityType, ReputationLevel } from '../../common/enums';
import { ReputationRepository } from './reputation.repository';
import { IReputation } from '../../common/interfaces';
import { ErrorReputation } from '../../common/constants/errors';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private readonly reputationRepository: ReputationRepository,
    private readonly configService: ConfigService,
  ) {}

  public getReputationLevel(reputationPoints: number): ReputationLevel {
    const reputationLevelLow = this.configService.get<number>(
      ConfigNames.REPUTATION_LEVEL_LOW,
    )!;

    const reputationLevelHigh = this.configService.get<number>(
      ConfigNames.REPUTATION_LEVEL_HIGH,
    )!;

    if (reputationPoints <= reputationLevelLow) {
      return ReputationLevel.LOW;
    }

    if (reputationPoints >= reputationLevelHigh) {
      return ReputationLevel.HIGH;
    }

    return ReputationLevel.MEDIUM;
  }

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

    return;
  }

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

    return;
  }

  public async getReputation(
    chainId: ChainId,
    address: string,
  ): Promise<IReputation> {
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
      reputation: this.getReputationLevel(
        reputationEntity.reputationPoints,
      ),
    }
  }

  public async getAllReputations(
    chainId?: ChainId,
  ): Promise<IReputation[]> {
    const reputations = await this.reputationRepository.find({
      chainId,
    });

    return reputations.map((reputation) => ({
      chainId: reputation.chainId,
      address: reputation.address,
      reputation: this.getReputationLevel(
        reputation.reputationPoints,
      ),
    }));
  }
}
