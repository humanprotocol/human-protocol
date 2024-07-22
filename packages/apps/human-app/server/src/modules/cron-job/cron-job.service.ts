import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
import {
  JobsDiscoveryParams,
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponseItem,
} from '../jobs-discovery/model/jobs-discovery.model';

@Injectable()
export class CronJobService {
  private cacheKey = 'availableJobs';

  constructor(
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Cron('*/1 * * * *')
  async updateJobsCache() {
    const jobsData = await this.fetchAllJobs();
    await this.cacheManager.set(this.cacheKey, jobsData, 900);
  }

  async fetchAllJobs(): Promise<JobsDiscoveryResponseItem[]> {
    let allResults: JobsDiscoveryResponseItem[] = [];

    // Initial fetch to determine the total number of pages
    const command = new JobsDiscoveryParamsCommand();
    command.data = new JobsDiscoveryParams();
    command.data.page = 0;
    command.data.pageSize = command.data.pageSize || 10; // Max value for Exchange Oracle
    const initialResponse = await this.exchangeOracleGateway.fetchJobs(command);
    allResults = this.mergeJobs(allResults, initialResponse.results);

    const totalPages = initialResponse.total_pages;

    // Fetch remaining pages
    const pageFetches = [];
    for (let i = 1; i < totalPages; i++) {
      command.data.page = i;
      pageFetches.push(this.exchangeOracleGateway.fetchJobs(command));
    }

    const remainingResponses = await Promise.all(pageFetches);
    for (const response of remainingResponses) {
      allResults = this.mergeJobs(allResults, response.results);
    }

    command.data.page = 0;
    return allResults;
  }

  private mergeJobs(
    cachedJobs: JobsDiscoveryResponseItem[],
    newJobs: JobsDiscoveryResponseItem[],
  ): JobsDiscoveryResponseItem[] {
    const jobsMap = new Map<string, JobsDiscoveryResponseItem>();

    for (const job of cachedJobs) {
      jobsMap.set(job.escrow_address + '-' + job.chain_id, job);
    }

    for (const job of newJobs) {
      jobsMap.set(job.escrow_address + '-' + job.chain_id, job);
    }

    return Array.from(jobsMap.values());
  }

  async getCachedJobs(): Promise<JobsDiscoveryResponseItem[]> {
    return (
      (await this.cacheManager.get<JobsDiscoveryResponseItem[]>(
        this.cacheKey,
      )) || []
    );
  }
}
