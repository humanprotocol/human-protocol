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
    const allJobs = await this.getCachedJobs(command.oracleAddress);
    const filteredJobs = this.applyFilters(allJobs || [], command.data);

    return paginateAndSortResults(
      filteredJobs,
      command.data.page,
      command.data.pageSize,
      command.data.sortField as keyof JobsDiscoveryResponseItem,
      command.data.sort,
    );
  }

  private applyFilters(
    jobs: JobsDiscoveryResponseItem[],
    filters: JobsDiscoveryParamsCommand['data'],
  ): JobsDiscoveryResponseItem[] {
    return jobs.filter((job) => {
      let matches = true;

      if (filters.escrowAddress) {
        matches = matches && job.escrow_address === filters.escrowAddress;
      }

      if (filters.chainId !== undefined && filters.chainId !== null) {
        matches = matches && job.chain_id === filters.chainId;
      }

      if (filters.jobType) {
        matches = matches && job.job_type === filters.jobType;
      }

      if (filters.status !== undefined && filters.status !== null) {
        matches = matches && job.status === filters.status;
      }

      return matches;
    });
  }

  async getCachedJobs(
    oracleAddress: string,
  ): Promise<JobsDiscoveryResponseItem[]> {
    return (
      (await this.cacheManager.get<JobsDiscoveryResponseItem[]>(
        `${JOB_DISCOVERY_CACHE_KEY}:${oracleAddress}`,
      )) || []
    );
  }
}
