import { Test, TestingModule } from '@nestjs/testing';
import { CronJobService } from '../cron-job.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { OracleDiscoveryService } from '../../../modules/oracle-discovery/oracle-discovery.service';
import { WorkerService } from '../../../modules/user-worker/worker.service';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import {
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponseItem,
} from '../../../modules/jobs-discovery/model/jobs-discovery.model';
import { JobStatus } from '../../../common/enums/global-common';
import { JobsDiscoveryService } from '../../../modules/jobs-discovery/jobs-discovery.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { generateOracleDiscoveryResponseBody } from '../../../modules/oracle-discovery/spec/oracle-discovery.fixture';
import { ChainId } from '@human-protocol/sdk';

jest.mock('cron', () => {
  return {
    CronJob: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
    })),
  };
});

describe('CronJobService', () => {
  let service: CronJobService;
  let exchangeOracleGatewayMock: Partial<ExchangeOracleGateway>;
  let oracleDiscoveryServiceMock: Partial<OracleDiscoveryService>;
  let jobDiscoveryServiceMock: Partial<JobsDiscoveryService>;
  let workerServiceMock: Partial<WorkerService>;
  let configServiceMock: Partial<EnvironmentConfigService>;

  beforeEach(async () => {
    exchangeOracleGatewayMock = {
      fetchJobs: jest.fn(),
    };

    oracleDiscoveryServiceMock = {
      discoverOracles: jest.fn(),
      updateOracleInCache: jest.fn(),
    };

    jobDiscoveryServiceMock = {
      setCachedJobs: jest.fn(),
    };

    workerServiceMock = {
      signinWorker: jest.fn(),
    };

    configServiceMock = {
      email: 'human-app@hmt.ai',
      password: 'Test1234*',
      cacheTtlOracleDiscovery: 600,
      chainIdsEnabled: [ChainId.POLYGON, ChainId.MAINNET],
      jobsDiscoveryFlag: false,
      maxExecutionToSkip: 32,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobService,
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
        {
          provide: OracleDiscoveryService,
          useValue: oracleDiscoveryServiceMock,
        },
        {
          provide: JobsDiscoveryService,
          useValue: jobDiscoveryServiceMock,
        },
        { provide: WorkerService, useValue: workerServiceMock },
        { provide: EnvironmentConfigService, useValue: configServiceMock },
        SchedulerRegistry,
      ],
    }).compile();

    service = module.get<CronJobService>(CronJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CronJobService - Cron Job Initialization', () => {
    const schedulerRegistryMock: any = {
      addCronJob: jest.fn(),
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize the cron job if jobsDiscoveryFlag is true', () => {
      (configServiceMock as any).jobsDiscoveryFlag = true;

      service = new CronJobService(
        exchangeOracleGatewayMock as ExchangeOracleGateway,
        configServiceMock as any,
        oracleDiscoveryServiceMock as OracleDiscoveryService,
        jobDiscoveryServiceMock as JobsDiscoveryService,
        workerServiceMock as WorkerService,
        schedulerRegistryMock,
      );

      expect(schedulerRegistryMock.addCronJob).toHaveBeenCalled();
    });

    it('should not initialize the cron job if jobsDiscoveryFlag is false', () => {
      (configServiceMock as any).jobsDiscoveryFlag = false;

      service = new CronJobService(
        exchangeOracleGatewayMock as ExchangeOracleGateway,
        configServiceMock as any,
        oracleDiscoveryServiceMock as OracleDiscoveryService,
        jobDiscoveryServiceMock as JobsDiscoveryService,
        workerServiceMock as WorkerService,
        schedulerRegistryMock,
      );

      expect(schedulerRegistryMock.addCronJob).not.toHaveBeenCalled();
    });
  });

  describe('updateJobsListCron', () => {
    it('should not proceed if no oracles are found', async () => {
      (
        oracleDiscoveryServiceMock.discoverOracles as jest.Mock
      ).mockResolvedValue([]);

      await service.updateJobsListCron();

      expect(oracleDiscoveryServiceMock.discoverOracles).toHaveBeenCalledWith();
      expect(workerServiceMock.signinWorker).not.toHaveBeenCalled();
    });

    it('should proceed with valid oracles and update jobs list cache', async () => {
      const oraclesDiscovery = generateOracleDiscoveryResponseBody();
      (
        oracleDiscoveryServiceMock.discoverOracles as jest.Mock
      ).mockResolvedValue(oraclesDiscovery);
      (workerServiceMock.signinWorker as jest.Mock).mockResolvedValue({
        access_token: 'token',
      });

      const updateJobsListCacheSpy = jest
        .spyOn(service, 'updateJobsListCache')
        .mockResolvedValue();

      await service.updateJobsListCron();

      expect(oracleDiscoveryServiceMock.discoverOracles).toHaveBeenCalledWith();
      expect(workerServiceMock.signinWorker).toHaveBeenCalledWith({
        email: configServiceMock.email,
        password: configServiceMock.password,
      });
      expect(updateJobsListCacheSpy).toHaveBeenCalledWith(
        oraclesDiscovery[0],
        'Bearer token',
      );
    });
  });

  describe('updateJobsListCache', () => {
    const oracle = generateOracleDiscoveryResponseBody()[0];
    const token = 'Bearer token';

    it('should fetch all jobs and update the cache', async () => {
      const initialResponse = {
        results: [{ escrow_address: '0xabc', chain_id: '1' }],
        total_pages: 1,
      };
      (exchangeOracleGatewayMock.fetchJobs as jest.Mock).mockResolvedValue(
        initialResponse,
      );

      await service.updateJobsListCache(oracle, token);

      expect(exchangeOracleGatewayMock.fetchJobs).toHaveBeenCalledWith(
        expect.any(JobsDiscoveryParamsCommand),
      );
      expect(jobDiscoveryServiceMock.setCachedJobs).toHaveBeenCalledWith(
        oracle.address,
        initialResponse.results,
      );
    });

    it('should handle errors and call handleJobListError', async () => {
      const error = new Error('Test error');
      (exchangeOracleGatewayMock.fetchJobs as jest.Mock).mockRejectedValue(
        error,
      );

      const handleJobListErrorSpy = jest.spyOn(
        service as any,
        'handleJobListError',
      );
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      await service.updateJobsListCache(oracle, token);

      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
      expect(handleJobListErrorSpy).toHaveBeenCalledWith(oracle);
    });

    it('should reset retries count after successful job fetch', async () => {
      const initialResponse = {
        results: [{ escrow_address: '0xabc', chain_id: '1' }],
        total_pages: 1,
      };
      (exchangeOracleGatewayMock.fetchJobs as jest.Mock).mockResolvedValue(
        initialResponse,
      );

      await service.updateJobsListCache(oracle, token);

      expect(
        oracleDiscoveryServiceMock.updateOracleInCache,
      ).toHaveBeenCalledWith({
        ...oracle,
        retriesCount: 0,
        executionsToSkip: 0,
      });
    });
  });

  describe('mergeJobs', () => {
    it('should merge jobs correctly', () => {
      const cachedJobs: JobsDiscoveryResponseItem[] = [
        {
          escrow_address: '0xabc',
          chain_id: 1,
          job_type: 'type1',
          status: JobStatus.ACTIVE,
        },
      ];
      const newJobs: JobsDiscoveryResponseItem[] = [
        {
          escrow_address: '0xdef',
          chain_id: 1,
          job_type: 'type2',
          status: JobStatus.CANCELED,
        },
      ];

      const result = service['mergeJobs'](cachedJobs, newJobs);

      expect(result).toEqual([
        {
          escrow_address: '0xabc',
          chain_id: 1,
          job_type: 'type1',
          status: JobStatus.ACTIVE,
        },
        {
          escrow_address: '0xdef',
          chain_id: 1,
          job_type: 'type2',
          status: JobStatus.CANCELED,
        },
      ]);
    });

    it('should update existing jobs with new data', () => {
      const cachedJobs: JobsDiscoveryResponseItem[] = [
        {
          escrow_address: '0xabc',
          chain_id: 1,
          job_type: 'type1',
          status: JobStatus.ACTIVE,
        },
      ];
      const newJobs: JobsDiscoveryResponseItem[] = [
        {
          escrow_address: '0xabc',
          chain_id: 1,
          job_type: 'type1',
          status: JobStatus.COMPLETED,
        },
      ];

      const result = service['mergeJobs'](cachedJobs, newJobs);

      expect(result).toEqual([
        {
          escrow_address: '0xabc',
          chain_id: 1,
          job_type: 'type1',
          status: JobStatus.COMPLETED,
        },
      ]);
    });
  });

  describe('handleJobListError', () => {
    it('should increment retries count and executions to skip but not exceed the limit', async () => {
      const oracleData = {
        ...generateOracleDiscoveryResponseBody()[0],
        retriesCount: 6,
        executionsToSkip: 0,
      };

      await (service as any).handleJobListError(oracleData);

      expect(
        oracleDiscoveryServiceMock.updateOracleInCache,
      ).toHaveBeenCalledWith({
        ...oracleData,
        retriesCount: 7,
        executionsToSkip: 32,
      });
    });

    it('should increment retries count and executions to skip', async () => {
      const oracleData = {
        ...generateOracleDiscoveryResponseBody()[0],
        retriesCount: 2,
        executionsToSkip: 0,
      };

      await (service as any).handleJobListError(oracleData);

      expect(
        oracleDiscoveryServiceMock.updateOracleInCache,
      ).toHaveBeenCalledWith({
        ...oracleData,
        retriesCount: 3,
        executionsToSkip: 4,
      });
    });
  });
});
