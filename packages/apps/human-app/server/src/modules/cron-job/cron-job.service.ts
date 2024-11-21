import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CronJob } from 'cron';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
import {
  JobsDiscoveryParams,
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponseItem,
} from '../jobs-discovery/model/jobs-discovery.model';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { JOB_DISCOVERY_CACHE_KEY } from '../../common/constants/cache';
import { OracleDiscoveryService } from '../oracle-discovery/oracle-discovery.service';
import {
  OracleDiscoveryCommand,
  OracleDiscoveryResponse,
} from '../oracle-discovery/model/oracle-discovery.model';
import { WorkerService } from '../user-worker/worker.service';
import { JobDiscoveryFieldName } from '../../common/enums/global-common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);
  constructor(
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: EnvironmentConfigService,
    private oracleDiscoveryService: OracleDiscoveryService,
    private workerService: WorkerService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    if (this.configService.jobsDiscoveryFlag) {
      this.initializeCronJob();
    }
  }

  initializeCronJob() {
    const job = new CronJob('* * * * *', () => {
      this.updateJobsListCron();
    });

    this.schedulerRegistry.addCronJob('updateJobsList', job);
    job.start();
  }

  async updateJobsListCron() {
    this.logger.log('CRON START');

    const oracleDiscoveryCommand: OracleDiscoveryCommand = {};
    const oracles = (
      await this.oracleDiscoveryService.processOracleDiscovery(
        oracleDiscoveryCommand,
      )
    ).oracles;

    if (!oracles || oracles.length < 1) return;

    try {
      const response = await this.workerService.signinWorker({
        email: this.configService.email,
        password: this.configService.password,
      });

      for (const oracle of oracles) {
        if (oracle.executionsToSkip > 0) {
          this.logger.log(
            `Skipping execution for oracle: ${oracle.address}. Remaining skips: ${oracle.executionsToSkip}`,
          );

          await this.updateOracleInCache(oracle, {
            executionsToSkip: oracle.executionsToSkip - 1,
          });
          continue;
        }

        await this.updateJobsListCache(
          oracle,
          'Bearer ' + response.access_token,
        );
      }
    } catch (e) {
      this.logger.error(e);
    }

    this.logger.log('CRON END');
  }

  async updateJobsListCache(oracle: OracleDiscoveryResponse, token: string) {
    try {
      let allResults: JobsDiscoveryResponseItem[] = [];

      // Initial fetch to determine the total number of pages
      const command = new JobsDiscoveryParamsCommand();
      command.oracleAddress = oracle.address;
      command.token = token;
      command.data = new JobsDiscoveryParams();
      command.data.page = 0;
      command.data.pageSize = command.data.pageSize || 10; // Max value for Exchange Oracle
      command.data.fields = [
        JobDiscoveryFieldName.CreatedAt,
        JobDiscoveryFieldName.JobDescription,
        JobDiscoveryFieldName.RewardAmount,
        JobDiscoveryFieldName.RewardToken,
        JobDiscoveryFieldName.Qualifications,
      ];
      const initialResponse =
        await this.exchangeOracleGateway.fetchJobs(command);
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

      await this.updateOracleInCache(oracle, {
        retriesCount: 0,
        executionsToSkip: 0,
      });

      await this.cacheManager.set(
        `${JOB_DISCOVERY_CACHE_KEY}:${oracle.address}`,
        allResults,
      );
    } catch (e) {
      this.logger.error(e);
      await this.handleJobListError(oracle);
    }
  }

  private async updateOracleInCache(
    oracleData: OracleDiscoveryResponse,
    updates: Partial<OracleDiscoveryResponse>,
  ) {
    const updatedOracle = { ...oracleData, ...updates };
    console.log(111, oracleData);
    const chainId = oracleData.chainId?.toString();
    const cachedOracles =
      await this.cacheManager.get<OracleDiscoveryResponse[]>(chainId);

    if (cachedOracles) {
      const updatedOracles = cachedOracles.map((oracle) =>
        oracle.address === oracleData.address ? updatedOracle : oracle,
      );
      await this.cacheManager.set(
        chainId,
        updatedOracles,
        this.configService.cacheTtlOracleDiscovery,
      );
    }
  }

  private async handleJobListError(oracleData: OracleDiscoveryResponse) {
    const retriesCount = oracleData.retriesCount || 0;
    const newExecutionsToSkip = Math.min(
      (oracleData.executionsToSkip || 0) + Math.pow(2, retriesCount),
      this.configService.maxExecutionToSkip,
    );

    await this.updateOracleInCache(oracleData, {
      retriesCount: retriesCount + 1,
      executionsToSkip: newExecutionsToSkip,
    });
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
}
