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
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { JOB_DISCOVERY_CACHE_KEY } from '../../common/constants/cache';
import { OracleDiscoveryService } from '../oracle-discovery/oracle-discovery.service';
import { OracleDiscoveryCommand } from '../oracle-discovery/model/oracle-discovery.model';
import { WorkerService } from '../user-worker/worker.service';

@Injectable()
export class CronJobService {
  constructor(
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: EnvironmentConfigService,
    private oracleDiscoveryService: OracleDiscoveryService,
    private workerService: WorkerService,
  ) {}

  @Cron('*/1 * * * *')
  async updateJobsListCron() {
    console.log('CRON START');

    const oracleDiscoveryCommand: OracleDiscoveryCommand = {};
    const oracles = await this.oracleDiscoveryService.processOracleDiscovery(
      oracleDiscoveryCommand,
    );

    if (!oracles) return;

    const response = await this.workerService.signinWorker({
      email: '',
      password: '',
      hCaptchaToken: '',
    });

    for (const oracle of oracles) {
      await this.updateJobsListCache(oracle.address, response.access_token);
    }
  }

  async updateJobsListCache(oracleAddress: string, token: string){
    let allResults: JobsDiscoveryResponseItem[] = [];

    // Initial fetch to determine the total number of pages
    const command = new JobsDiscoveryParamsCommand();
    command.oracleAddress = oracleAddress;
    command.token = token;
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

    await this.cacheManager.set(
      JOB_DISCOVERY_CACHE_KEY,
      allResults,
      this.configService.cacheTtlJobDiscovery,
    );
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

    console.log('CRON END');
    return Array.from(jobsMap.values());
  }
}
