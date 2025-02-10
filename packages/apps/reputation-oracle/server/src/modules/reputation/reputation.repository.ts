import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { DataSource, ILike, In } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { ReputationEntity } from './reputation.entity';
import {
  ReputationEntityType,
  ReputationOrderBy,
  SortDirection,
} from '../../common/enums';

@Injectable()
export class ReputationRepository extends BaseRepository<ReputationEntity> {
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
      where: { address: ILike(address), chainId },
    });
  }

  public findByChainId(chainId?: ChainId): Promise<ReputationEntity[]> {
    return this.find({
      where: chainId && { chainId },
      order: {
        createdAt: SortDirection.DESC,
      },
    });
  }

  public findByChainIdAndTypes(
    chainId?: ChainId,
    types?: ReputationEntityType[],
    orderBy?: ReputationOrderBy,
    orderDirection?: SortDirection,
    first?: number,
    skip?: number,
  ): Promise<ReputationEntity[]> {
    const mapOrderBy = ReputationRepository.mapOrderBy(
      orderBy || ReputationOrderBy.CREATED_AT,
    );

    return this.find({
      where: {
        ...(chainId && { chainId }),
        ...(types && types.length > 0 && { type: In(types) }),
      },
      order: {
        [mapOrderBy]: orderDirection || SortDirection.DESC,
      },
      ...(skip && { skip }),
      ...(first && { take: first }),
    });
  }

  private static mapOrderBy(orderBy: ReputationOrderBy): string {
    const orderByMap = {
      [ReputationOrderBy.CREATED_AT]: 'createdAt',
      [ReputationOrderBy.REPUTATION_POINTS]: 'reputationPoints',
    };
    return orderByMap[orderBy] || orderByMap[ReputationOrderBy.CREATED_AT];
  }
}
