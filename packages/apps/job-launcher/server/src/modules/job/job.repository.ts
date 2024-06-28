import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ServerConfigService } from '../../common/config/server-config.service';
import { SortDirection } from '../../common/enums/collection';
import { DataSource, In, LessThanOrEqual } from 'typeorm';
import {
  JobSortField,
  JobStatus,
  JobStatusFilter,
} from '../../common/enums/job';
import { JobEntity } from './job.entity';
import { BaseRepository } from '../../database/base.repository';
import { ListResult } from './job.interface';
import { GetJobsDto } from './job.dto';

@Injectable()
export class JobRepository extends BaseRepository<JobEntity> {
  constructor(
    private dataSource: DataSource,
    public readonly serverConfigService: ServerConfigService,
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

  public async findManyByChainIdsAndEscrowAddresses(
    chainId: ChainId[],
    escrowAddress: string[],
  ): Promise<JobEntity[]> {
    return this.find({
      where: {
        chainId: In(chainId),
        escrowAddress: In(escrowAddress),
      },
    });
  }

  public async findByStatus(
    status: JobStatus,
    take?: number,
  ): Promise<JobEntity[]> {
    return this.find({
      where: {
        status: status,
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },
      order: {
        createdAt: SortDirection.DESC,
        waitUntil: SortDirection.ASC,
      },
      ...(take && { take }),
    });
  }

  public async fetchFiltered(
    data: GetJobsDto,
    userId: number,
  ): Promise<ListResult> {
    let statusFilter: JobStatus[];

    switch (data.status) {
      case JobStatusFilter.PENDING:
        statusFilter = [
          JobStatus.PENDING,
          JobStatus.PAID,
          JobStatus.CREATED,
          JobStatus.SET_UP,
        ];
        break;
      case JobStatusFilter.CANCELED:
        statusFilter = [JobStatus.TO_CANCEL, JobStatus.CANCELED];
        break;
      default:
        statusFilter = [data.status as any];
        break;
    }

    const queryBuilder = this.createQueryBuilder('job');

    if (data.sortField == JobSortField.CHAIN_ID)
      queryBuilder.orderBy(`job.${data.sortField}`, data.sort);
    else if (data.sortField == JobSortField.CREATED_AT)
      queryBuilder.orderBy(`job.${data.sortField}`, data.sort);

    queryBuilder.where('job.userId = :userId', { userId });
    if (data.status !== undefined) {
      queryBuilder.andWhere('job.status IN (:...statusFilter)', {
        statusFilter,
      });
    }

    if (data.chainId !== undefined) {
      queryBuilder.andWhere('job.chain_id IN (:...chainIds)', {
        chainIds: data.chainId,
      });
    }

    queryBuilder.offset(data.skip).limit(data.pageSize);

    const itemCount = await queryBuilder.getCount();
    const entities = await queryBuilder.getMany();

    return { entities, itemCount };
  }
}
