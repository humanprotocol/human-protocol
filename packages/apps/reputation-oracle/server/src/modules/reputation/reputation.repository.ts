import { ChainId } from '@human-protocol/sdk';
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { ReputationEntity } from './reputation.entity';

@Injectable()
export class ReputationRepository extends BaseRepository<ReputationEntity> {
  private readonly logger = new Logger(ReputationRepository.name);

  constructor(private dataSource: DataSource) {
    super(ReputationEntity, dataSource);
  }

  public findOneByAddress(address: string): Promise<ReputationEntity | null> {
    return this.findOne({
      where: { address },
    });
  }

  public findOneByAddressAndChainId(
    address: string,
    chainId: ChainId,
  ): Promise<ReputationEntity | null> {
    return this.findOne({
      where: { address, chainId },
    });
  }

  public findByChainId(chainId?: ChainId): Promise<ReputationEntity[]> {
    return this.find({
      where: chainId && { chainId },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
