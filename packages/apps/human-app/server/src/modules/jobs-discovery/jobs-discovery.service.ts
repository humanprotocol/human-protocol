import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { JOB_DISCOVERY_CACHE_KEY } from '../../common/constants/cache';
import {
  Iteratee,
  paginateAndSortResults,
} from '../../common/utils/pagination.utils';
import {
  DiscoveredJob,
  GetJobsCommand,
  GetJobsResponseDto,
  JobDiscoverySortField,
} from './model/jobs-discovery.model';

@Injectable()
export class JobsDiscoveryService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: EnvironmentConfigService,
  ) {}

  async getJobs(command: GetJobsCommand): Promise<GetJobsResponseDto> {
    const allJobs = await this.getCachedJobs(command.oracleAddress);
    let filteredJobs = this.applyFilters(allJobs, command.data);
    filteredJobs = filteredJobs.filter((job) =>
      this.configService.chainIdsEnabled.includes(job.chain_id),
    );

    const sortField =
      command.data.sortField || JobDiscoverySortField.CREATED_AT;

    let iteratee: JobDiscoverySortField | Iteratee<DiscoveredJob>;
    if (sortField === JobDiscoverySortField.REWARD_AMOUNT) {
      iteratee = (job: DiscoveredJob) => {
        const rewardAmount = Number(job[sortField].trim());

        return Number.isFinite(rewardAmount) ? rewardAmount : 0;
      };
    } else {
      iteratee = sortField;
    }

    return paginateAndSortResults(
      filteredJobs,
      command.data.page,
      command.data.pageSize,
      iteratee,
      command.data.sort,
    );
  }

  private applyFilters(
    jobs: DiscoveredJob[],
    filters: GetJobsCommand['data'],
  ): DiscoveredJob[] {
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

      if (
        filters.qualifications !== undefined &&
        filters.qualifications !== null
      ) {
        if (job.qualifications && job.qualifications.length > 0) {
          matches =
            matches &&
            job.qualifications.every((qualification) =>
              filters.qualifications?.includes(qualification),
            );
        }
      }

      return matches;
    });
  }

  static makeCacheKeyForOracle(oracleAddress: string): string {
    return `${JOB_DISCOVERY_CACHE_KEY}:${oracleAddress.toLowerCase()}`;
  }

  async getCachedJobs(oracleAddress: string): Promise<DiscoveredJob[]> {
    const cacheKey = JobsDiscoveryService.makeCacheKeyForOracle(oracleAddress);

    const cachedJobs = await this.cacheManager.get<DiscoveredJob[] | undefined>(
      cacheKey,
    );

    return cachedJobs || [];
  }

  async setCachedJobs(
    oracleAddress: string,
    jobs: DiscoveredJob[],
  ): Promise<void> {
    const cacheKey = JobsDiscoveryService.makeCacheKeyForOracle(oracleAddress);

    await this.cacheManager.set(
      cacheKey,
      jobs,
      this.configService.cacheTtlOracleAvailableJobs,
    );
  }
}
