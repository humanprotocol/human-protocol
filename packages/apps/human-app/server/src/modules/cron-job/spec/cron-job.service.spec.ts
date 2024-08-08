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
      ],
    }).compile();

    service = module.get<CronJobService>(CronJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
        oracles[0].address,
        'Bearer token',
      );
    });
  });

  describe('updateJobsListCache', () => {
    it('should fetch all jobs and update the cache', async () => {
      const oracleAddress = '0x123';
      const token = 'Bearer token';
      const initialResponse = {
        results: [{ escrow_address: '0xabc', chain_id: '1' }],
        total_pages: 1,
      };
      (exchangeOracleGatewayMock.fetchJobs as jest.Mock).mockResolvedValue(
        initialResponse,
      );

      await service.updateJobsListCache(oracleAddress, token);

      expect(exchangeOracleGatewayMock.fetchJobs).toHaveBeenCalledWith(
        expect.any(JobsDiscoveryParamsCommand),
      );
      expect(cacheManagerMock.set).toHaveBeenCalledWith(
        `${JOB_DISCOVERY_CACHE_KEY}:${oracleAddress}`,
        initialResponse.results,
      );
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
});
