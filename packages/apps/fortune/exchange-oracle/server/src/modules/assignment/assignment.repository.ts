import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { AssignmentEntity } from './assignment.entity';
import { AssignmentStatus } from '../../common/enums/job';
import { ChainId } from '@human-protocol/sdk';
import { AssignmentFilterData, ListResult } from './assignment.interface';
import { AssignmentSortField } from '../../common/enums/job';
import { convertToDatabaseSortDirection } from '../../common/utils/database';

@Injectable()
export class AssignmentRepository extends BaseRepository<AssignmentEntity> {
  constructor(
    private dataSource: DataSource,
    public readonly configService: ConfigService,
  ) {
    super(AssignmentEntity, dataSource);
  }

  public async findByWorkerAddress(
    workerAddress: string,
  ): Promise<AssignmentEntity[]> {
    return this.find({
      where: {
        workerAddress,
      },
    });
  }

  public async findOneByJobIdAndWorker(
    jobId: number,
    workerAddress: string,
  ): Promise<AssignmentEntity | null> {
    return this.findOne({
      where: {
        jobId,
        workerAddress,
      },
    });
  }

  public async findOneByEscrowAndWorker(
    escrowAddress: string,
    chainId: ChainId,
    workerAddress: string,
  ): Promise<AssignmentEntity | null> {
    return this.findOne({
      where: {
        job: { escrowAddress, chainId },
        workerAddress,
      },
    });
  }

  public async findOneById(
    assignmentId: number,
  ): Promise<AssignmentEntity | null> {
    return this.findOne({
      where: {
        id: assignmentId,
      },
      relations: ['job'],
    });
  }

  public async countByJobId(jobId: ChainId): Promise<number> {
    return this.count({
      where: {
        jobId,
      },
    });
  }

  public async countTotalAssignments(workerAddress?: string): Promise<number> {
    const where: any = {};
    if (workerAddress) {
      where.workerAddress = workerAddress;
    }
    return this.count({ where });
  }

  public async countCompletedAssignments(
    workerAddress?: string,
  ): Promise<number> {
    const where: any = { status: AssignmentStatus.COMPLETED };
    if (workerAddress) {
      where.workerAddress = workerAddress;
    }
    return this.count({ where });
  }

  public async countSentAssignments(workerAddress?: string): Promise<number> {
    const where: any = { status: AssignmentStatus.VALIDATION };
    if (workerAddress) {
      where.workerAddress = workerAddress;
    }
    return this.count({ where });
  }

  public async countRejectedAssignments(
    workerAddress?: string,
  ): Promise<number> {
    const where: any = { status: AssignmentStatus.REJECTED };
    if (workerAddress) {
      where.workerAddress = workerAddress;
    }
    return this.count({ where });
  }

  public async countExpiredAssignments(
    workerAddress?: string,
  ): Promise<number> {
    const where: any = { status: AssignmentStatus.EXPIRED };
    if (workerAddress) {
      where.workerAddress = workerAddress;
    }
    return this.count({ where });
  }

  public async countTotalWorkers(): Promise<number> {
    const count = await this.createQueryBuilder('assignment')
      .select('COUNT(DISTINCT assignment.workerAddress)', 'count')
      .getRawOne();

    return parseInt(count.count, 10);
  }

  public async fetchFiltered(data: AssignmentFilterData): Promise<ListResult> {
    const queryBuilder = this.createQueryBuilder(
      'assignment',
    ).leftJoinAndSelect('assignment.job', 'job');

    const dbSortDirection = convertToDatabaseSortDirection(data.sort);
    switch (data.sortField) {
      case AssignmentSortField.CHAIN_ID:
        queryBuilder.orderBy('job.chainId', dbSortDirection);
        break;
      case AssignmentSortField.STATUS:
        queryBuilder.orderBy('assignment.status', dbSortDirection);
        break;
      case AssignmentSortField.CREATED_AT:
        queryBuilder.orderBy('assignment.createdAt', dbSortDirection);
        break;
      case AssignmentSortField.EXPIRES_AT:
        queryBuilder.orderBy('assignment.expiresAt', dbSortDirection);
        break;
      case AssignmentSortField.REWARD_AMOUNT:
        queryBuilder.orderBy('assignment.rewardAmount', dbSortDirection);
        break;
      default:
        queryBuilder.orderBy('assignment.createdAt', dbSortDirection);
    }

    if (data.chainId !== undefined) {
      queryBuilder.andWhere('job.chainId = :chainId', {
        chainId: data.chainId,
      });
    }

    if (data.assignmentId !== undefined) {
      queryBuilder.andWhere('assignment.id = :assignmentId', {
        assignmentId: data.assignmentId,
      });
    }

    if (data.rewardAmount !== undefined) {
      queryBuilder.andWhere('assignment.rewardAmount = :rewardAmount', {
        rewardAmount: data.rewardAmount,
      });
    }
    if (data.escrowAddress) {
      queryBuilder.andWhere('job.escrowAddress = :escrowAddress', {
        escrowAddress: data.escrowAddress,
      });
    }
    if (data.status !== undefined) {
      queryBuilder.andWhere('assignment.status = :status', {
        status: data.status,
      });
    }

    if (data.createdAfter) {
      queryBuilder.andWhere('assignment.createdAt >= :createdAfter', {
        createdAfter: data.createdAfter,
      });
    }

    if (data.updatedAfter) {
      queryBuilder.andWhere('assignment.updatedAt >= :updatedAfter', {
        updatedAfter: data.updatedAfter,
      });
    }

    queryBuilder.andWhere('job.reputationNetwork = :reputationNetwork', {
      reputationNetwork: data.reputationNetwork,
    });

    queryBuilder.andWhere('assignment.workerAddress = :workerAddress', {
      workerAddress: data.workerAddress,
    });

    queryBuilder.offset(data.skip).limit(data.pageSize);

    const [entities, itemCount] = await queryBuilder.getManyAndCount();

    return { entities, itemCount };
  }
}
