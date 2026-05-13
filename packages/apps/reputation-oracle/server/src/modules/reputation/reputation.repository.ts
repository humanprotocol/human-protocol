import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, In } from 'typeorm';

import { SortDirection } from '@/common/enums';
import { JobRequestType } from '@/common/types';
import { BaseRepository } from '@/database';
import { caseInsensitiveAddress } from '@/utils/database';

import { ReputationEntityType, ReputationOrderBy } from './constants';
import { ReputationEntity } from './reputation.entity';
import type { ExclusiveReputationCriteria } from './types';

@Injectable()
export class ReputationRepository extends BaseRepository<ReputationEntity> {
  constructor(dataSource: DataSource) {
    super(ReputationEntity, dataSource);
  }

  findExclusive({
    chainId,
    address,
    type,
    jobRequestType,
  }: ExclusiveReputationCriteria): Promise<ReputationEntity | null> {
    return this.findOne({
      where: {
        chainId,
        address: caseInsensitiveAddress(address),
        type,
        jobRequestType,
      },
    });
  }

  findPaginated(
    filters: {
      address?: string;
      chainId?: ChainId;
      jobRequestTypes?: JobRequestType[];
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
    if (filters.jobRequestTypes) {
      query.jobRequestType = In(filters.jobRequestTypes);
    }
    if (filters.address) {
      query.address = caseInsensitiveAddress(filters.address);
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
