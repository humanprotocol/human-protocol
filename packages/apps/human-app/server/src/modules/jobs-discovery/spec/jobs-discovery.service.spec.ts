import { JobsDiscoveryService } from '../jobs-discovery.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import {
  jobsDiscoveryParamsCommandFixture,
  responseItemsFixture,
} from './jobs-discovery.fixtures';
import { CronJobService } from '../../../modules/cron-job/cron-job.service';

describe('JobsDiscoveryService', () => {
  let service: JobsDiscoveryService;
  let cronJobService: CronJobService;
  let exchangeOracleGatewayMock: Partial<ExchangeOracleGateway>;
  beforeEach(async () => {
    exchangeOracleGatewayMock = {
      fetchJobs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsDiscoveryService,
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
        {
          provide: CronJobService,
          useValue: {
            getCachedJobs: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<JobsDiscoveryService>(JobsDiscoveryService);
    cronJobService = module.get<CronJobService>(CronJobService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('processJobsDiscovery', () => {
    it('should get oracle url and call api for jobs fetch', async () => {
      const command = jobsDiscoveryParamsCommandFixture;

      (cronJobService.getCachedJobs as jest.Mock).mockResolvedValue(
        responseItemsFixture,
      );

      const result = await service.processJobsDiscovery(command);
      expect(cronJobService.getCachedJobs).toHaveBeenCalledWith();
      expect(result.results).toEqual(responseItemsFixture);
    });
  });
});
