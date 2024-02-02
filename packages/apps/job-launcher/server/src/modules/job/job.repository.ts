import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';
import { DEFAULT_MAX_RETRY_COUNT } from '../../common/constants';
import { SortDirection } from '../../common/enums/collection';
import { DataSource, In, LessThanOrEqual } from 'typeorm';
import { JobStatus, JobStatusFilter } from '../../common/enums/job';
import { JobEntity } from './job.entity';
import { BaseRepository } from '../../database/base.repository';

@Injectable()
export class JobRepository extends BaseRepository<JobEntity> {
  constructor(
    private dataSource: DataSource,
    public readonly configService: ConfigService,
  ) {
    super(JobEntity, dataSource);
  }

  public async findOneByIdAndUserId(
    id: number,
    userId: number,
  ): Promise<JobEntity | null> {
    return this.findOne({
      where: {
        id,
        userId,
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

  public async findByStatus(status: JobStatus): Promise<JobEntity[]> {
    return this.find({
      where: {
        status: status,
        retriesCount: LessThanOrEqual(
          this.configService.get(
            ConfigNames.MAX_RETRY_COUNT,
            DEFAULT_MAX_RETRY_COUNT,
          ),
        ),
        waitUntil: LessThanOrEqual(new Date()),
      },
      order: {
        createdAt: SortDirection.DESC,
        waitUntil: SortDirection.ASC,
      },
    });
  }

  public async findByStatusFilter(
    chainIds: ChainId[],
    userId: number,
    status: JobStatusFilter,
    skip: number,
    limit: number,
  ): Promise<JobEntity[]> {
    const statusFilter =
      status === JobStatusFilter.PENDING
        ? In([
            JobStatus.PENDING,
            JobStatus.PAID,
            JobStatus.CREATED,
            JobStatus.SET_UP,
          ])
        : In([status]);

    return this.find({
      where: { userId, status: statusFilter, chainId: In(chainIds) },
      skip,
      take: limit,
    });
  }

  public async findByEscrowAddresses(
    userId: number,
    escrowAddresses: string[],
  ): Promise<JobEntity[]> {
    return this.find({
      where: {
        userId,
        escrowAddress: In(escrowAddresses),
      },
    });
  }
}
