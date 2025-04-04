import { Injectable, Logger } from '@nestjs/common';
import { CronJob } from 'cron';
import { ExchangeOracleGateway } from '../../integrations/exchange-oracle/exchange-oracle.gateway';
import {
  DiscoveredJob,
  JobsDiscoveryParams,
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponse,
} from '../jobs-discovery/model/jobs-discovery.model';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { OracleDiscoveryService } from '../oracle-discovery/oracle-discovery.service';
import { DiscoveredOracle } from '../oracle-discovery/model/oracle-discovery.model';
import { WorkerService } from '../user-worker/worker.service';
import {
  JobDiscoveryFieldName,
  JobStatus,
} from '../../common/enums/global-common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { JobsDiscoveryService } from '../jobs-discovery/jobs-discovery.service';

function assertJobsDiscoveryResponseItemsFormat(
  items: JobsDiscoveryResponse['results'],
): asserts items is DiscoveredJob[] {
  if (items.length === 0) {
    return;
  }

  const item = items[0];
  if (
    [
      item.job_description,
      item.reward_amount,
      item.reward_token,
      item.created_at,
      item.updated_at,
    ].includes(undefined)
  ) {
    throw new Error('Job discovery response items missing expected fields');
  }
}

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);
  constructor(
    private readonly exchangeOracleGateway: ExchangeOracleGateway,
    private configService: EnvironmentConfigService,
    private oracleDiscoveryService: OracleDiscoveryService,
    private jobsDiscoveryService: JobsDiscoveryService,
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

    const oracles = await this.oracleDiscoveryService.discoverOracles();

    if (oracles.length === 0) {
      return;
    }

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

          await this.oracleDiscoveryService.updateOracleInCache({
            ...oracle,
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

  async updateJobsListCache(oracle: DiscoveredOracle, token: string) {
    try {
      let allResults: DiscoveredJob[] = [];

      // Initial fetch to determine the total number of pages
      const command = new JobsDiscoveryParamsCommand();
      command.oracleAddress = oracle.address;
      command.token = token;
      command.data = new JobsDiscoveryParams();
      command.data.page = 0;
      command.data.pageSize = command.data.pageSize || 10; // Max value for Exchange Oracle
      command.data.fields = [
        JobDiscoveryFieldName.JobDescription,
        JobDiscoveryFieldName.RewardAmount,
        JobDiscoveryFieldName.RewardToken,
        JobDiscoveryFieldName.CreatedAt,
        JobDiscoveryFieldName.UpdatedAt,
      ];
      command.data.status = JobStatus.ACTIVE;
      const initialResponse =
        await this.exchangeOracleGateway.fetchJobs(command);

      assertJobsDiscoveryResponseItemsFormat(initialResponse.results);

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
        assertJobsDiscoveryResponseItemsFormat(response.results);
        allResults = this.mergeJobs(allResults, response.results);
      }

      await this.oracleDiscoveryService.updateOracleInCache({
        ...oracle,
        retriesCount: 0,
        executionsToSkip: 0,
      });

      await this.jobsDiscoveryService.setCachedJobs(oracle.address, allResults);
    } catch (e) {
      this.logger.error(e);
      await this.handleJobListError(oracle);
    }
  }

  private async handleJobListError(oracleData: DiscoveredOracle) {
    const retriesCount = oracleData.retriesCount || 0;
    const newExecutionsToSkip = Math.min(
      (oracleData.executionsToSkip || 0) + Math.pow(2, retriesCount),
      this.configService.maxExecutionToSkip,
    );

    await this.oracleDiscoveryService.updateOracleInCache({
      ...oracleData,
      retriesCount: retriesCount + 1,
      executionsToSkip: newExecutionsToSkip,
    });
  }

  private mergeJobs(
    cachedJobs: DiscoveredJob[],
    newJobs: DiscoveredJob[],
  ): DiscoveredJob[] {
    const jobsMap = new Map<string, DiscoveredJob>();

    for (const job of cachedJobs) {
      jobsMap.set(job.escrow_address + '-' + job.chain_id, job);
    }

    for (const job of newJobs) {
      jobsMap.set(job.escrow_address + '-' + job.chain_id, job);
    }

    return Array.from(jobsMap.values());
  }
}
