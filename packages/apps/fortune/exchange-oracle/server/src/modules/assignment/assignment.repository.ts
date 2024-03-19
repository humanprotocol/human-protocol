import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { AssignmentEntity } from './assignment.entity';
import { AssignmentStatus } from '../../common/enums/job';

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

  public async findByStatus(
    status: AssignmentStatus,
  ): Promise<AssignmentEntity[]> {
    return this.find({
      where: {
        status,
      },
    });
  }

  public async findAssignmentsWithDetails(
    status: AssignmentStatus,
    jobId: number,
  ): Promise<AssignmentEntity[]> {
    const queryBuilder = this.createQueryBuilder('assignment');

    if (status) {
      queryBuilder.andWhere('assignment.status = :status', { status });
    }

    if (jobId) {
      queryBuilder.andWhere('assignment.jobId = :jobId', { jobId });
    }

    return queryBuilder.getMany();
  }
}
