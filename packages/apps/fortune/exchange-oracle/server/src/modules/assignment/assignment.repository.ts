import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { AssignmentEntity } from './assignment.entity';
import { AssignmentStatus } from '../../common/enums/job';
import { ChainId } from '@human-protocol/sdk';
import { AssignmentFilterData, ListResult } from './assignment.interface';
import { AssignmentSortField } from '../../common/enums/job';

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
    workerAddress: string,
  ): Promise<AssignmentEntity | null> {
    return this.findOne({
      where: {
        job: { escrowAddress },
        workerAddress,
      },
    });
  }
  
  public async countByJobId(jobId: ChainId): Promise<number> {
    return this.count({
      where: {
        jobId,
      },
    });
  }

  public async fetchFiltered(data: AssignmentFilterData): Promise<ListResult> {
    const queryBuilder = await this.createQueryBuilder(
      'assignment',
    ).leftJoinAndSelect('assignment.job', 'job', 'assignment.jobId = job.id');

    if (data.sortField == AssignmentSortField.CHAIN_ID)
      queryBuilder.orderBy(`job.${data.sortField}`, data.sort);
    else if (data.sortField == AssignmentSortField.CREATED_AT)
      queryBuilder.orderBy(`assignment.${data.sortField}`, data.sort);
    else if (data.sortField == AssignmentSortField.STATUS)
      queryBuilder.orderBy(`assignment.${data.sortField}`, data.sort);
    else if (data.sortField == AssignmentSortField.EXPIRES_AT)
      queryBuilder.orderBy(`assignment.${data.sortField}`, data.sort);

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
      queryBuilder.andWhere('assignment.status = :status', {
        status: data.status,
      });
    }

    queryBuilder.andWhere('job.reputationNetwork = :reputationNetwork', {
      reputationNetwork: data.reputationNetwork,
    });

    queryBuilder.andWhere('assignment.workerAddress = :workerAddress', {
      workerAddress: data.workerAddress,
    });

    queryBuilder.offset(data.skip).limit(data.pageSize);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    return { entities, itemCount };
  }
}
