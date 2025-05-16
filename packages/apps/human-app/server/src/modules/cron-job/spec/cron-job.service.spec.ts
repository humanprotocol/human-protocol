import { ChainId } from '@human-protocol/sdk';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { CronJobService } from '../cron-job.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { OracleDiscoveryService } from '../../../modules/oracle-discovery/oracle-discovery.service';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import {
  DiscoveredJob,
  JobsDiscoveryParamsCommand,
  JobsDiscoveryResponse,
  JobsDiscoveryResponseItem,
} from '../../../modules/jobs-discovery/model/jobs-discovery.model';
import { JobStatus } from '../../../common/enums/global-common';
import { JobsDiscoveryService } from '../../../modules/jobs-discovery/jobs-discovery.service';
import { generateOracleDiscoveryResponseBody } from '../../../modules/oracle-discovery/spec/oracle-discovery.fixture';

import { HMT_TOKEN_SYMBOL } from '../../../common/constants/hmt';

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
  let reputationOracleGatewayMock: Partial<ReputationOracleGateway>;
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

    reputationOracleGatewayMock = {
      sendM2mSignin: jest.fn(),
    };

    configServiceMock = {
      m2mAuthSecretKey: 'sk_test_e7ODIlpLSKNlNV8nRK_2rqLsGu_ft-84C7c-dJzJ3kU',
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
        {
          provide: ReputationOracleGateway,
          useValue: reputationOracleGatewayMock,
        },
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
        reputationOracleGatewayMock as ReputationOracleGateway,
        exchangeOracleGatewayMock as ExchangeOracleGateway,
        configServiceMock as any,
        oracleDiscoveryServiceMock as OracleDiscoveryService,
        jobDiscoveryServiceMock as JobsDiscoveryService,
        schedulerRegistryMock,
      );

      expect(schedulerRegistryMock.addCronJob).toHaveBeenCalled();
    });

    it('should not initialize the cron job if jobsDiscoveryFlag is false', () => {
      (configServiceMock as any).jobsDiscoveryFlag = false;

      service = new CronJobService(
        reputationOracleGatewayMock as ReputationOracleGateway,
        exchangeOracleGatewayMock as ExchangeOracleGateway,
        configServiceMock as any,
        oracleDiscoveryServiceMock as OracleDiscoveryService,
        jobDiscoveryServiceMock as JobsDiscoveryService,
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
      expect(reputationOracleGatewayMock.sendM2mSignin).not.toHaveBeenCalled();
    });

    it('should proceed with valid oracles and update jobs list cache', async () => {
      const oraclesDiscovery = generateOracleDiscoveryResponseBody();
      (
        oracleDiscoveryServiceMock.discoverOracles as jest.Mock
      ).mockResolvedValue(oraclesDiscovery);
      (
        reputationOracleGatewayMock.sendM2mSignin as jest.Mock
      ).mockResolvedValue({
        access_token: 'token',
      });

      const updateJobsListCacheSpy = jest
        .spyOn(service, 'updateJobsListCache')
        .mockResolvedValue();

      await service.updateJobsListCron();

      expect(oracleDiscoveryServiceMock.discoverOracles).toHaveBeenCalledWith();
      expect(reputationOracleGatewayMock.sendM2mSignin).toHaveBeenCalledWith(
        configServiceMock.m2mAuthSecretKey,
      );
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
      const now = new Date();
      const initialResponse: JobsDiscoveryResponse = {
        results: [
          {
            escrow_address: '0xabc',
            chain_id: 1,
            job_type: '',
            status: JobStatus.ACTIVE,
            job_description: 'Best job ever',
            reward_amount: '42',
            reward_token: HMT_TOKEN_SYMBOL,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            qualifications: [],
          },
        ],
        total_pages: 1,
        page: 0,
        page_size: 5,
        total_results: 1,
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
      const now = new Date();
      const initialResponse: JobsDiscoveryResponse = {
        results: [
          {
            escrow_address: '0xabc',
            chain_id: 1,
            job_type: 'test',
            status: JobStatus.ACTIVE,
            job_description: 'Best job ever',
            reward_amount: '42',
            reward_token: HMT_TOKEN_SYMBOL,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            qualifications: [],
          },
        ],
        total_pages: 1,
        page: 0,
        page_size: 5,
        total_results: 1,
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
      const now = new Date();
      const cachedJobs: DiscoveredJob[] = [
        {
          escrow_address: '0xabc',
          chain_id: 1,
          job_type: 'type1',
          status: JobStatus.ACTIVE,
          job_description: 'Best job ever',
          reward_amount: '42',
          reward_token: HMT_TOKEN_SYMBOL,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          qualifications: [],
        },
      ];

      const newJobs: JobsDiscoveryResponseItem[] = [
        {
          escrow_address: '0xdef',
          chain_id: 1,
          job_type: 'type2',
          status: JobStatus.CANCELED,
          job_description: 'Greatest job',
          reward_amount: '42',
          reward_token: HMT_TOKEN_SYMBOL,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          qualifications: [],
        },
      ];

      const result = service['mergeJobs'](
        cachedJobs,
        newJobs as DiscoveredJob[],
      );

      expect(result).toEqual([cachedJobs[0], newJobs[0]]);
    });

    it('should update existing jobs with new data', () => {
      const now = new Date();
      const cachedJobs: DiscoveredJob[] = [
        {
          escrow_address: '0xabc',
          chain_id: 1,
          job_type: 'type1',
          status: JobStatus.ACTIVE,
          job_description: 'Best job ever',
          reward_amount: '42',
          reward_token: HMT_TOKEN_SYMBOL,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          qualifications: [],
        },
      ];
      const newJobs: JobsDiscoveryResponseItem[] = [
        {
          escrow_address: '0xabc',
          chain_id: 1,
          job_type: 'type1',
          status: JobStatus.COMPLETED,
          job_description: 'Nice job',
          reward_amount: '42',
          reward_token: HMT_TOKEN_SYMBOL,
          created_at: now.toISOString(),
          updated_at: new Date().toISOString(),
          qualifications: [],
        },
      ];

      const result = service['mergeJobs'](
        cachedJobs,
        newJobs as DiscoveredJob[],
      );

      expect(result).toEqual(newJobs);
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
