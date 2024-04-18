import { Test, TestingModule } from '@nestjs/testing';
import { JobAssignmentService } from '../job-assignment.service';
import { KvStoreGateway } from '../../../integrations/kv-store/kv-store-gateway.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import {
  jobAssignmentCommandFixture,
  jobAssignmentDetailsFixture,
  jobsFetchParamsCommandFixture,
  jobsFetchParamsDetailsFixture,
} from './job-assignment.fixtures';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';

describe('JobAssignmentService', () => {
  let service: JobAssignmentService;
  let exchangeOracleGatewayMock: Partial<ExchangeOracleGateway>;
  let kvStoreGatewayMock: Partial<KvStoreGateway>;
  beforeEach(async () => {
    exchangeOracleGatewayMock = {
      postNewJobAssignment: jest.fn(),
      fetchAssignedJobs: jest.fn(),
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
        JobAssignmentService,
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
        { provide: KvStoreGateway, useValue: kvStoreGatewayMock },
      ],
    }).compile();

    service = module.get<JobAssignmentService>(JobAssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processJobAssignment', () => {
    it('should process job assignment correctly', async () => {
      const command = jobAssignmentCommandFixture;
      const details = jobAssignmentDetailsFixture;

      (
        kvStoreGatewayMock.getExchangeOracleUrlByAddress as jest.Mock
      ).mockResolvedValue('https://example.com');
      (
        exchangeOracleGatewayMock.postNewJobAssignment as jest.Mock
      ).mockResolvedValue({
        assignment_id: '123',
      });

      const result = await service.processJobAssignment(command);

      expect(
        kvStoreGatewayMock.getExchangeOracleUrlByAddress,
      ).toHaveBeenCalledWith(command.address);
      expect(
        exchangeOracleGatewayMock.postNewJobAssignment,
      ).toHaveBeenCalledWith(details);
      expect(result).toEqual({ assignment_id: '123' });
    });
  });

  describe('processGetAssignedJobs', () => {
    it('should fetch assigned jobs correctly', async () => {
      const command = jobsFetchParamsCommandFixture;
      const details = jobsFetchParamsDetailsFixture;

      (
        kvStoreGatewayMock.getExchangeOracleUrlByAddress as jest.Mock
      ).mockResolvedValue(details.exchangeOracleUrl);
      (
        exchangeOracleGatewayMock.fetchAssignedJobs as jest.Mock
      ).mockResolvedValue({
        data: [],
      });

      const result = await service.processGetAssignedJobs(command);

      expect(
        kvStoreGatewayMock.getExchangeOracleUrlByAddress,
      ).toHaveBeenCalledWith(command.address);
      expect(exchangeOracleGatewayMock.fetchAssignedJobs).toHaveBeenCalledWith(
        details,
      );
      expect(result).toEqual({ data: [] });
    });
  });
});
