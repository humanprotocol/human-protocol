import { Injectable } from '@nestjs/common';
import { ServerConfigService } from '../../common/config/server-config.service';
import { SortDirection } from '../../common/enums/collection';
import { DataSource } from 'typeorm';
import { JobModerationTaskStatus } from '../../common/enums/job';
import { JobModerationTaskEntity } from './job-moderation-task.entity';
import { BaseRepository } from '../../database/base.repository';

@Injectable()
export class JobModerationTaskRepository extends BaseRepository<JobModerationTaskEntity> {
  constructor(
    private dataSource: DataSource,
    public readonly serverConfigService: ServerConfigService,
  ) {
    super(JobModerationTaskEntity, dataSource);
  }

  public async findByStatus(
    status: JobModerationTaskStatus,
  ): Promise<JobModerationTaskEntity[]> {
    return this.find({
      where: {
        status,
      },
      order: {
        createdAt: SortDirection.DESC,
      },
    });
  }

  public async findByJobIdAndStatus(
    jobId: number,
    status: JobModerationTaskStatus,
  ): Promise<JobModerationTaskEntity[]> {
    return this.find({
      where: {
        jobId,
        status,
      },
      order: {
        createdAt: SortDirection.DESC,
      },
    });
  }
}
