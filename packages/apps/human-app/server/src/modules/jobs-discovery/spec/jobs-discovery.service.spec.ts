import { JobsDiscoveryService } from '../jobs-discovery.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import {
  jobsDiscoveryParamsCommandFixture,
  responseFixture,
} from './jobs-discovery.fixtures';

describe('JobsDiscoveryService', () => {
  let service: JobsDiscoveryService;
  let exchangeOracleGatewayMock: Partial<ExchangeOracleGateway>;
  beforeEach(async () => {
    exchangeOracleGatewayMock = {
      fetchJobs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsDiscoveryService,
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
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

      (exchangeOracleGatewayMock.fetchJobs as jest.Mock).mockResolvedValue(
        responseFixture,
      );

      const result = await service.processJobsDiscovery(command);
      expect(exchangeOracleGatewayMock.fetchJobs).toHaveBeenCalledWith(command);
      expect(result).toEqual(responseFixture);
    });
  });
});
