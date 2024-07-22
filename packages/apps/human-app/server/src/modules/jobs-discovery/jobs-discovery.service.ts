import { Injectable } from '@nestjs/common';
import { paginateAndSortResults } from '../../common/utils/pagination.utils';
import { CronJobService } from '../cron-job/cron-job.service';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponse,
  JobsDiscoveryResponseItem,
} from './model/jobs-discovery.model';

@Injectable()
export class JobsDiscoveryService {
  constructor(private cronJobService: CronJobService) {}

  async processJobsDiscovery(
    command: JobsDiscoveryParamsCommand,
  ): Promise<JobsDiscoveryResponse> {
    const allJobs = await this.cronJobService.getCachedJobs();
    return paginateAndSortResults(
      allJobs || [],
      command.data.page,
      command.data.pageSize,
      command.data.sortField as keyof JobsDiscoveryResponseItem,
      command.data.sort,
    );
  }
}
