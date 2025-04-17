import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, In } from 'typeorm';

import { SortDirection } from '../../common/enums';
import { BaseRepository } from '../../database/base.repository';

import { ReputationEntityType, ReputationOrderBy } from './constants';
import { ReputationEntity } from './reputation.entity';

export type ExclusiveReputationCriteria = {
  chainId: number;
  address: string;
  type: ReputationEntityType;
};

@Injectable()
export class ReputationRepository extends BaseRepository<ReputationEntity> {
  constructor(dataSource: DataSource) {
    super(ReputationEntity, dataSource);
  }

  findExclusive({
    chainId,
    address,
    type,
  }: ExclusiveReputationCriteria): Promise<ReputationEntity | null> {
    return this.findOne({
      where: {
        chainId,
        address,
        type,
      },
    });
  }

  findPaginated(
    filters: {
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
  ): Promise<ReputationEntity[]> {
    const query: FindManyOptions<ReputationEntity>['where'] = {};
    if (filters.chainId) {
      query.chainId = filters.chainId;
    }
    if (filters.types) {
      query.type = In(filters.types);
    }
    if (filters.address) {
      query.address = filters.address;
    }

    return this.find({
      where: query,
      order: {
        [options?.orderBy || ReputationOrderBy.CREATED_AT]:
          options?.orderDirection || SortDirection.ASC,
      },
      take: options?.first || 10,
      skip: options?.skip,
    });
  }
}
