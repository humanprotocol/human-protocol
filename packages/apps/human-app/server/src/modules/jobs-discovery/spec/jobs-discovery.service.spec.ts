import { JobsDiscoveryService } from '../jobs-discovery.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import {
  jobsDiscoveryParamsCommandFixture,
  responseItemsFixture,
  responseItemFixture1,
  responseItemFixture3,
} from './jobs-discovery.fixtures';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('JobsDiscoveryService', () => {
  let service: JobsDiscoveryService;
  let exchangeOracleGatewayMock: Partial<ExchangeOracleGateway>;
  let cacheManagerMock: any;

  beforeEach(async () => {
    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    exchangeOracleGatewayMock = {
      fetchJobs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsDiscoveryService,
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
      ],
    }).compile();

    service = module.get<JobsDiscoveryService>(JobsDiscoveryService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('processJobsDiscovery', () => {
    it('should get oracle url and call api for jobs fetch', async () => {
      const command = jobsDiscoveryParamsCommandFixture;

      jest
        .spyOn(service as any, 'getCachedJobs')
        .mockReturnValue(responseItemsFixture);

      const result = await service.processJobsDiscovery(command);
      expect(service.getCachedJobs).toHaveBeenCalledWith(
        jobsDiscoveryParamsCommandFixture.oracleAddress,
      );
      expect(result.results).toEqual([
        responseItemFixture3,
        responseItemFixture1,
      ]);
    });
  });
});
