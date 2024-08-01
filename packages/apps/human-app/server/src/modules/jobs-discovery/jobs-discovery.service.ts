import { Inject, Injectable } from '@nestjs/common';
import { paginateAndSortResults } from '../../common/utils/pagination.utils';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponse,
  JobsDiscoveryResponseItem,
} from './model/jobs-discovery.model';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { JOB_DISCOVERY_CACHE_KEY } from '../../common/constants/cache';

@Injectable()
export class JobsDiscoveryService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async processJobsDiscovery(
    command: JobsDiscoveryParamsCommand,
  ): Promise<JobsDiscoveryResponse> {
    const allJobs = await this.getCachedJobs();
    return paginateAndSortResults(
      allJobs || [],
      command.data.page,
      command.data.pageSize,
      command.data.sortField as keyof JobsDiscoveryResponseItem,
      command.data.sort,
    );
  }

  async getCachedJobs(): Promise<JobsDiscoveryResponseItem[]> {
    return (
      (await this.cacheManager.get<JobsDiscoveryResponseItem[]>(
        JOB_DISCOVERY_CACHE_KEY,
      )) || []
    );
  }
}
