import { JobsDiscoveryService } from '../jobs-discovery.service';
import { KvStoreGateway } from '../../../integrations/kv-store/kv-store-gateway.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { JobsDiscoveryProfile } from '../jobs-discovery.mapper';
import {
  jobsDiscoveryOracleUrlFixture,
  jobsDiscoveryParamsCommandFixture,
  jobsDiscoveryParamsDetailsFixture,
  responseFixture,
} from './jobs-discovery.fixtures';

describe('JobsDiscoveryService', () => {
  let service: JobsDiscoveryService;
  let exchangeOracleGatewayMock: Partial<ExchangeOracleGateway>;
  let kvStoreGatewayMock: Partial<KvStoreGateway>;
  beforeEach(async () => {
    exchangeOracleGatewayMock = {
      fetchJobs: jest.fn(),
    };
    kvStoreGatewayMock = {
      getExchangeOracleUrlByAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        JobsDiscoveryService,
        JobsDiscoveryProfile,
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
        { provide: KvStoreGateway, useValue: kvStoreGatewayMock },
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
      const details = jobsDiscoveryParamsDetailsFixture;

      (
        kvStoreGatewayMock.getExchangeOracleUrlByAddress as jest.Mock
      ).mockResolvedValue(jobsDiscoveryOracleUrlFixture);
      (exchangeOracleGatewayMock.fetchJobs as jest.Mock).mockResolvedValue(
        responseFixture,
      );

      const result = await service.processJobsDiscovery(command);
      expect(
        kvStoreGatewayMock.getExchangeOracleUrlByAddress,
      ).toHaveBeenCalledWith(command.oracleAddress);
      expect(exchangeOracleGatewayMock.fetchJobs).toHaveBeenCalledWith(details);
      expect(result).toEqual(responseFixture);
    });
  });
});
