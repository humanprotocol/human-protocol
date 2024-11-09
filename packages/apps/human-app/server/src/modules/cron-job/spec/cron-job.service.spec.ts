import { CACHE_MANAGER } from '@nestjs/cache-manager';
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
import { JOB_DISCOVERY_CACHE_KEY } from '../../../common/constants/cache';
import { JobStatus } from '../../../common/enums/global-common';
import { OracleDiscoveryResponse } from '../../../modules/oracle-discovery/model/oracle-discovery.model';
import { SchedulerRegistry } from '@nestjs/schedule';
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
  let workerServiceMock: Partial<WorkerService>;
  let cacheManagerMock: any;
  let configServiceMock: Partial<EnvironmentConfigService>;

  beforeEach(async () => {
    exchangeOracleGatewayMock = {
      fetchJobs: jest.fn(),
    };

    oracleDiscoveryServiceMock = {
      processOracleDiscovery: jest.fn(),
    };

    workerServiceMock = {
      signinWorker: jest.fn(),
    };

    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    configServiceMock = {
      email: 'human-app@hmt.ai',
      password: 'Test1234*',
      cacheTtlOracleDiscovery: 600,
      chainIdsEnabled: [ChainId.POLYGON, ChainId.MAINNET],
      jobsDiscoveryFlag: false,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobService,
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
        {
          provide: OracleDiscoveryService,
          useValue: oracleDiscoveryServiceMock,
        },
        { provide: WorkerService, useValue: workerServiceMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
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
        cacheManagerMock,
        configServiceMock as any,
        oracleDiscoveryServiceMock as OracleDiscoveryService,
        workerServiceMock as WorkerService,
        schedulerRegistryMock,
      );

      expect(schedulerRegistryMock.addCronJob).toHaveBeenCalled();
    });

    it('should not initialize the cron job if jobsDiscoveryFlag is false', () => {
      (configServiceMock as any).jobsDiscoveryFlag = false;

      service = new CronJobService(
        exchangeOracleGatewayMock as ExchangeOracleGateway,
        cacheManagerMock,
        configServiceMock as any,
        oracleDiscoveryServiceMock as OracleDiscoveryService,
        workerServiceMock as WorkerService,
        schedulerRegistryMock,
      );

      expect(schedulerRegistryMock.addCronJob).not.toHaveBeenCalled();
    });
  });

  describe('updateJobsListCron', () => {
    it('should not proceed if no oracles are found', async () => {
      (
        oracleDiscoveryServiceMock.processOracleDiscovery as jest.Mock
      ).mockResolvedValue([]);

      await service.updateJobsListCron();

      expect(
        oracleDiscoveryServiceMock.processOracleDiscovery,
      ).toHaveBeenCalledWith({});
      expect(workerServiceMock.signinWorker).not.toHaveBeenCalled();
    });

    it('should proceed with valid oracles and update jobs list cache', async () => {
      const oracles = [{ address: '0x123' }];
      (
        oracleDiscoveryServiceMock.processOracleDiscovery as jest.Mock
      ).mockResolvedValue(oracles);
      (workerServiceMock.signinWorker as jest.Mock).mockResolvedValue({
        access_token: 'token',
      });

      const updateJobsListCacheSpy = jest
        .spyOn(service, 'updateJobsListCache')
        .mockResolvedValue();

      await service.updateJobsListCron();

      expect(
        oracleDiscoveryServiceMock.processOracleDiscovery,
      ).toHaveBeenCalledWith({});
      expect(workerServiceMock.signinWorker).toHaveBeenCalledWith({
        email: configServiceMock.email,
        password: configServiceMock.password,
      });
      expect(updateJobsListCacheSpy).toHaveBeenCalledWith(
        oracles[0],
        'Bearer token',
      );
    });
  });

  describe('updateJobsListCache', () => {
    it('should fetch all jobs and update the cache', async () => {
      const oracle: OracleDiscoveryResponse = {
        address: 'mockAddress1',
        role: 'validator',
        chainId: ChainId.POLYGON,
        retriesCount: 0,
      };
      const token = 'Bearer token';
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
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        `${JOB_DISCOVERY_CACHE_KEY}:${oracle.address}`,
        initialResponse.results,
      );
    });

    it('should handle errors and call handleJobListError', async () => {
      const oracle: OracleDiscoveryResponse = {
        address: 'mockAddress1',
        role: 'validator',
        chainId: ChainId.POLYGON,
        retriesCount: 0,
      };
      const token = 'Bearer token';
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
      const oracle: OracleDiscoveryResponse = {
        address: 'mockAddress1',
        role: 'validator',
        chainId: ChainId.POLYGON,
        retriesCount: 3,
      };
      const token = 'Bearer token';
      const initialResponse = {
        results: [{ escrow_address: '0xabc', chain_id: '1' }],
        total_pages: 1,
      };
      (exchangeOracleGatewayMock.fetchJobs as jest.Mock).mockResolvedValue(
        initialResponse,
      );

      const resetRetriesCountSpy = jest.spyOn(
        service as any,
        'resetRetriesCount',
      );

      await service.updateJobsListCache(oracle, token);

      expect(resetRetriesCountSpy).toHaveBeenCalledWith(oracle);
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

  describe('resetRetriesCount', () => {
    it('should reset retries count and activate oracle', async () => {
      const oracleData: OracleDiscoveryResponse = {
        address: 'mockAddress1',
        role: 'validator',
        chainId: ChainId.POLYGON,
        retriesCount: 5,
      };

      cacheManagerMock.get.mockResolvedValue([oracleData]);

      await (service as any).resetRetriesCount(oracleData);

      expect(oracleData.retriesCount).toBe(0);
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        oracleData.chainId.toString(),
        [oracleData],
        configServiceMock.cacheTtlOracleDiscovery,
      );
    });
  });

  describe('handleJobListError', () => {
    it('should increment retries count and deactivate oracle after 5 failures', async () => {
      const oracleData: OracleDiscoveryResponse = {
        address: 'mockAddress1',
        role: 'validator',
        chainId: ChainId.POLYGON,
        retriesCount: 4,
      };

      cacheManagerMock.get.mockResolvedValue([oracleData]);

      await (service as any).handleJobListError(oracleData);

      expect(oracleData.retriesCount).toBe(5);
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        oracleData.chainId.toString(),
        [oracleData],
        configServiceMock.cacheTtlOracleDiscovery,
      );
    });

    it('should increment retries count but keep oracle active if less than 5 failures', async () => {
      const oracleData: OracleDiscoveryResponse = {
        address: 'mockAddress1',
        role: 'validator',
        chainId: ChainId.POLYGON,
        retriesCount: 2,
      };

      cacheManagerMock.get.mockResolvedValue([oracleData]);

      await (service as any).handleJobListError(oracleData);

      expect(oracleData.retriesCount).toBe(3);
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        oracleData.chainId.toString(),
        [oracleData],
        configServiceMock.cacheTtlOracleDiscovery,
      );
    });

    it('should do nothing if oracle is not found in cache', async () => {
      cacheManagerMock.get.mockResolvedValue([]);

      await (service as any).handleJobListError('unknownAddress');

      expect(cacheManagerMock.set).not.toHaveBeenCalled();
    });
  });
});
