import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { JobEntity } from './job.entity';
import { JobSortField, JobStatus } from '../../common/enums/job';
import { JobFilterData, ListResult } from './job.interface';

@Injectable()
export class JobRepository extends BaseRepository<JobEntity> {
  constructor(
    private dataSource: DataSource,
    public readonly configService: ConfigService,
  ) {
    super(JobEntity, dataSource);
  }

  public async findOneById(id: number): Promise<JobEntity | null> {
    return this.findOne({
      where: {
        id,
      },
    });
  }

  public async findOneByChainIdAndEscrowAddress(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<JobEntity | null> {
    return this.findOne({
      where: {
        chainId,
        escrowAddress,
      },
    });
  }

  public async findOneByChainIdAndEscrowAddressWithAssignments(
    chainId: number,
    escrowAddress: string,
  ): Promise<JobEntity | null> {
    return this.findOne({
      where: {
        chainId,
        escrowAddress,
      },
      relations: ['assignments'],
    });
  }

  public async fetchFiltered(data: JobFilterData): Promise<ListResult> {
    const queryBuilder = this.createQueryBuilder('job');

    if (
      data.sortField == JobSortField.CHAIN_ID ||
      data.sortField == JobSortField.CREATED_AT ||
      data.sortField == JobSortField.UPDATED_AT
    )
      queryBuilder.orderBy(data.sortField!, data.sort);

    if (data.chainId !== undefined) {
      queryBuilder.andWhere('job.chainId = :chainId', {
        chainId: data.chainId,
      });
    }
    if (data.escrowAddress) {
      queryBuilder.andWhere('job.escrowAddress = :escrowAddress', {
        escrowAddress: data.escrowAddress,
      });
    }
    if (data.status !== undefined) {
      queryBuilder.andWhere('job.status = :status', { status: data.status });
    }

    if (data.createdAfter) {
      queryBuilder.andWhere('job.createdAt >= :createdAfter', {
        createdAfter: data.createdAfter,
      });
    }

    if (data.updatedAfter) {
      queryBuilder.andWhere('job.updatedAt >= :updatedAfter', {
        updatedAfter: data.updatedAfter,
      });
    }

    queryBuilder.andWhere('job.reputationNetwork = :reputationNetwork', {
      reputationNetwork: data.reputationNetwork,
    });

    queryBuilder.offset(data.skip).limit(data.pageSize);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();
    return { entities, itemCount };
  }

  public async countJobsByStatus(status: JobStatus): Promise<number> {
    return this.count({
      where: {
        status,
      },
    });
  }
}
