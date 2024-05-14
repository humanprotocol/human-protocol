import { Test, TestingModule } from '@nestjs/testing';
import { JobAssignmentService } from '../job-assignment.service';
import { KvStoreGateway } from '../../../integrations/kv-store/kv-store-gateway.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import {
  jobAssignmentCommandFixture,
  jobAssignmentDetailsFixture,
  jobAssignmentOracleUrl,
  jobsFetchParamsCommandFixture,
  jobsFetchParamsDetailsFixture,
} from './job-assignment.fixtures';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { JobAssignmentProfile } from '../job-assignment.mapper';
import { EscrowUtilsGateway } from '../../../integrations/escrow/escrow-utils-gateway.service';

describe('JobAssignmentService', () => {
  let service: JobAssignmentService;
  let exchangeOracleGatewayMock: Partial<ExchangeOracleGateway>;
  let kvStoreGatewayMock: Partial<KvStoreGateway>;
  let escrowUtilsGatewayMock: Partial<EscrowUtilsGateway>;
  beforeEach(async () => {
    exchangeOracleGatewayMock = {
      postNewJobAssignment: jest.fn(),
      fetchAssignedJobs: jest.fn(),
    };
    kvStoreGatewayMock = {
      getExchangeOracleUrlByAddress: jest.fn(),
    };
    escrowUtilsGatewayMock = {
      getExchangeOracleAddressByEscrowAddress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        JobAssignmentService,
        JobAssignmentProfile,
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
        { provide: KvStoreGateway, useValue: kvStoreGatewayMock },
        { provide: EscrowUtilsGateway, useValue: escrowUtilsGatewayMock },
      ],
    }).compile();

    service = module.get<JobAssignmentService>(JobAssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processJobAssignment', () => {
    it('should process job assignment correctly', async () => {
      const escrowUtilExchangeOracleAddress = '0x';
      const command = jobAssignmentCommandFixture;
      const details = jobAssignmentDetailsFixture;
      (
        escrowUtilsGatewayMock.getExchangeOracleAddressByEscrowAddress as jest.Mock
      ).mockResolvedValue(escrowUtilExchangeOracleAddress);
      (
        kvStoreGatewayMock.getExchangeOracleUrlByAddress as jest.Mock
      ).mockResolvedValue(jobAssignmentOracleUrl);
      (
        exchangeOracleGatewayMock.postNewJobAssignment as jest.Mock
      ).mockResolvedValue({
        assignment_id: '123',
      });

      const result = await service.processJobAssignment(command);

      expect(
        escrowUtilsGatewayMock.getExchangeOracleAddressByEscrowAddress,
      ).toHaveBeenCalledWith(command.data.chainId, command.data.escrowAddress);
      expect(
        kvStoreGatewayMock.getExchangeOracleUrlByAddress,
      ).toHaveBeenCalledWith(escrowUtilExchangeOracleAddress);
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
      ).mockResolvedValue(jobAssignmentOracleUrl);
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
