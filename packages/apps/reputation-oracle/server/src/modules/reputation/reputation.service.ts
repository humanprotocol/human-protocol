import { Injectable, Logger } from '@nestjs/common';
import { ChainId } from '@human-protocol/sdk';
import { INITIAL_REPUTATION } from '../../common/constants';
import { ReputationEntityType, ReputationScore } from '../../common/enums';
import { ReputationEntity } from './reputation.entity';
import { ReputationRepository } from './reputation.repository';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private readonly reputationRepository: ReputationRepository) {}

  public getReputationScore(reputationPoints: number): ReputationScore {
    if (reputationPoints <= 299) {
      return ReputationScore.LOW;
    }

    if (reputationPoints <= 699) {
      return ReputationScore.MEDIUM;
    }

    return ReputationScore.HIGH;
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
  ): Promise<ReputationEntity> {
    const reputationEntity = await this.reputationRepository.findOne({
      address,
      chainId,
    });

    return reputationEntity;
  }

  public async getAllReputations(
    chainId?: ChainId,
  ): Promise<Array<ReputationEntity>> {
    return await this.reputationRepository.find({
      chainId,
    });
  }
}
