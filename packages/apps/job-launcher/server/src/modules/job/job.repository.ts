import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  Repository,
  In,
} from 'typeorm';
import { JobEntity } from './job.entity';
import { JobCreateDto, JobUpdateDataDto } from './job.dto';
import { ErrorJob } from '../../common/constants/errors';
import { JobStatus, JobStatusFilter } from '../../common/enums/job';
import { ChainId } from '@human-protocol/sdk';

@Injectable()
export class JobRepository {
  private readonly logger = new Logger(JobRepository.name);

  constructor(
    @InjectRepository(JobEntity)
    private readonly jobEntityRepository: Repository<JobEntity>,
  ) {}

  public async updateOne(
    where: FindOptionsWhere<JobEntity>,
    dto: Partial<JobUpdateDataDto>,
  ): Promise<JobEntity> {
    const jobEntity = await this.jobEntityRepository.findOneBy(where);

    if (!jobEntity) {
      this.logger.log(ErrorJob.NotFound, JobRepository.name);
      throw new NotFoundException(ErrorJob.NotFound);
    }

    Object.assign(jobEntity, dto);
    return jobEntity.save();
  }

  public async findOne(
    where: FindOptionsWhere<JobEntity>,
    options?: FindOneOptions<JobEntity>,
  ): Promise<JobEntity | null> {
    return this.jobEntityRepository.findOne({
      where,
      ...options,
    });
  }

  public find(
    where: FindOptionsWhere<JobEntity>,
    options?: FindManyOptions<JobEntity>,
  ): Promise<JobEntity[]> {
    return this.jobEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async findJobsByStatusFilter(
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

    return this.find(
      { userId, status: statusFilter, chainId: In(chainIds) },
      { skip, take: limit },
    );
  }

  public async findJobsByEscrowAddresses(
    userId: number,
    escrowAddresses: string[],
  ): Promise<JobEntity[]> {
    return this.find({
      userId,
      escrowAddress: In(escrowAddresses),
    });
  }

  public async create(dto: JobCreateDto): Promise<JobEntity> {
    return this.jobEntityRepository.create(dto).save();
  }
}
