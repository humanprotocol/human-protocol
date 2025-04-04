import { ChainId } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ServerConfigService } from '../../common/config/server-config.service';
import { SortDirection } from '../../common/enums/collection';
import { DataSource, In, LessThanOrEqual, Not } from 'typeorm';
import {
  JobSortField,
  JobStatus,
  JobStatusFilter,
} from '../../common/enums/job';
import { JobEntity } from './job.entity';
import { BaseRepository } from '../../database/base.repository';
import { ListResult } from './job.interface';
import { GetJobsDto } from './job.dto';
import {
  JobStatusPerDayDto,
  FundAmountStatisticsDto,
  JobCountDto,
} from '../statistic/statistic.dto';
import { convertToDatabaseSortDirection } from '../../database/database.utils';
import { PaymentSource } from 'src/common/enums/payment';

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
    status: JobStatus | JobStatus[],
    take?: number,
  ): Promise<JobEntity[]> {
    const statusCondition = Array.isArray(status) ? In(status) : status;
    return this.find({
      where: {
        status: statusCondition,
        retriesCount: LessThanOrEqual(this.serverConfigService.maxRetryCount),
        waitUntil: LessThanOrEqual(new Date()),
      },
      order: {
        createdAt: SortDirection.DESC,
        waitUntil: SortDirection.ASC,
      },
      ...(take && { take }),
      relations: ['contentModerationRequests'],
    });
  }

  public async findActiveByUserAndPaymentSource(
    userId: number,
    paymentSource: PaymentSource,
  ): Promise<JobEntity[]> {
    return this.find({
      where: {
        userId,
        status: Not(In([JobStatus.COMPLETED, JobStatus.CANCELED])),
        payments: {
          source: paymentSource,
        },
      },
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
          JobStatus.PAID,
          JobStatus.UNDER_MODERATION,
          JobStatus.MODERATION_PASSED,
          JobStatus.POSSIBLE_ABUSE_IN_REVIEW,
          JobStatus.CREATED,
          JobStatus.FUNDED,
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

    const dbSortDirection = convertToDatabaseSortDirection(data.sort);
    if (data.sortField == JobSortField.CHAIN_ID)
      queryBuilder.orderBy(`job.${data.sortField}`, dbSortDirection);
    else if (data.sortField == JobSortField.CREATED_AT)
      queryBuilder.orderBy(`job.${data.sortField}`, dbSortDirection);

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

  async getAverageCompletionTime(): Promise<number> {
    const queryBuilder = this.createQueryBuilder('job')
      .select(
        'AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60)',
        'average_completion_time_minutes',
      )
      .where('job.status = :status', { status: JobStatus.COMPLETED });

    const result = await queryBuilder.getRawOne();
    return parseFloat(result.average_completion_time_minutes);
  }

  async getFundAmountStats(): Promise<FundAmountStatisticsDto> {
    const queryBuilder = this.createQueryBuilder('job')
      .select('AVG(job.fundAmount)', 'average')
      .addSelect('MAX(job.fundAmount)', 'maximum')
      .addSelect('MIN(job.fundAmount)', 'minimum');

    const result = await queryBuilder.getRawOne();
    return {
      average: parseFloat(result.average) || 0,
      maximum: parseFloat(result.maximum) || 0,
      minimum: parseFloat(result.minimum) || 0,
    };
  }

  async getGlobalJobCounts(): Promise<JobCountDto> {
    const queryBuilder = this.createQueryBuilder('job')
      .select('COUNT(job.id)', 'totalJobs')
      .addSelect(
        'SUM(CASE WHEN job.status = :partial THEN 1 ELSE 0 END)',
        'partial',
      )
      .addSelect(
        'SUM(CASE WHEN job.status = :completed THEN 1 ELSE 0 END)',
        'completed',
      )
      .addSelect(
        'SUM(CASE WHEN job.status = :canceled THEN 1 ELSE 0 END)',
        'canceled',
      )
      .setParameters({
        partial: JobStatus.PARTIAL,
        completed: JobStatus.COMPLETED,
        canceled: JobStatus.CANCELED,
      });

    const result = await queryBuilder.getRawOne();
    return {
      totalJobs: parseInt(result.totalJobs, 10) || 0,
      launched: parseInt(result.totalJobs, 10) || 0,
      partial: parseInt(result.partial, 10) || 0,
      completed: parseInt(result.completed, 10) || 0,
      canceled: parseInt(result.canceled, 10) || 0,
    };
  }

  async getLaunchedJobsPerDay(): Promise<JobStatusPerDayDto[]> {
    const queryBuilder = this.createQueryBuilder('job')
      .select('DATE(job.created_at)', 'date')
      .addSelect('COUNT(job.id)', 'launched')
      .groupBy('DATE(job.created_at)')
      .orderBy('DATE(job.created_at)', 'ASC');

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      date: result.date.toISOString(),
      launched: parseInt(result.launched, 10),
      partial: 0,
      completed: 0,
      canceled: 0,
    }));
  }

  async getJobsByStatusPerDay(): Promise<JobStatusPerDayDto[]> {
    const queryBuilder = this.createQueryBuilder('job')
      .select('DATE(job.updated_at)', 'date')
      .addSelect(
        'SUM(CASE WHEN job.status = :partial THEN 1 ELSE 0 END)',
        'partial',
      )
      .addSelect(
        'SUM(CASE WHEN job.status = :completed THEN 1 ELSE 0 END)',
        'completed',
      )
      .addSelect(
        'SUM(CASE WHEN job.status = :canceled THEN 1 ELSE 0 END)',
        'canceled',
      )
      .groupBy('DATE(job.updated_at)')
      .orderBy('DATE(job.updated_at)', 'ASC')
      .setParameters({
        partial: JobStatus.PARTIAL,
        completed: JobStatus.COMPLETED,
        canceled: JobStatus.CANCELED,
      });

    const results = await queryBuilder.getRawMany();

    return results.map((result) => ({
      date: result.date.toISOString(),
      launched: 0,
      partial: parseInt(result.partial, 10),
      completed: parseInt(result.completed, 10),
      canceled: parseInt(result.canceled, 10),
    }));
  }
}
