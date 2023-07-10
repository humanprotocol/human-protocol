import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { JobEntity } from './job.entity';
import { JobCreateDto, JobUpdateDataDto } from './job.dto';
import { ErrorJob } from '../../common/constants/errors';

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
  ): Promise<JobEntity> {
    const jobEntity = await this.jobEntityRepository.findOne({
      where,
      ...options,
    });

    if (!jobEntity) {
      this.logger.log(ErrorJob.NotFound, JobRepository.name);
      throw new NotFoundException(ErrorJob.NotFound);
    }

    return jobEntity;
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

  public async create(dto: JobCreateDto): Promise<JobEntity> {
    return this.jobEntityRepository.create(dto).save();
  }
}
