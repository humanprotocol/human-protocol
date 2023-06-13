import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { Repository } from "typeorm";
import { ReputationRepository } from "./reputation.repository";
import { ErrorReputation } from "src/common/constants/errors";
import { ReputationEntity } from "./reputation.entity";
import { ChainId } from "@human-protocol/sdk";
import { INITIAL_REPUTATION } from "src/common/constants";
import { ReputationEntityType } from "src/common/decorators";

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private readonly reputationRepository: ReputationRepository,
    private readonly configService: ConfigService,
  ) {}

  public async increaseReputation(chainId: ChainId, address: string, type: ReputationEntityType): Promise<void> {
    const reputationEntity = await this.reputationRepository.findOne({ address })

    if (!reputationEntity) {
      this.reputationRepository.create({
        chainId,
        address,
        reputationPoints: INITIAL_REPUTATION + 1,
        type
      });

      return;
    }

    Object.assign(reputationEntity, { reputationPoints: reputationEntity.reputationPoints + 1 });
    reputationEntity.save();

    return;
  }

  public async decreaseReputation(chainId: ChainId, address: string, type: ReputationEntityType): Promise<void> {
    const reputationEntity = await this.reputationRepository.findOne({ address })

    if (!reputationEntity) {
      this.reputationRepository.create({
        chainId,
        address,
        reputationPoints: INITIAL_REPUTATION - 1,
        type
      });

      return;
    }

    Object.assign(reputationEntity, { reputationPoints: reputationEntity.reputationPoints - 1 });
    reputationEntity.save();

    return;
  }
}
