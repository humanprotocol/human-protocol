import { Test, TestingModule } from '@nestjs/testing';
import { JobAssignmentService } from '../job-assignment.service';
import { ExchangeOracleGateway } from '../../../integrations/exchange-oracle/exchange-oracle.gateway';
import {
  jobAssignmentCommandFixture,
  jobsFetchParamsCommandFixture,
} from './job-assignment.fixtures';
import { JobAssignmentProfile } from '../job-assignment.mapper.profile';

describe('JobAssignmentService', () => {
  let service: JobAssignmentService;
  let exchangeOracleGatewayMock: Partial<ExchangeOracleGateway>;
  beforeEach(async () => {
    exchangeOracleGatewayMock = {
      postNewJobAssignment: jest.fn(),
      fetchAssignedJobs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobAssignmentService,
        { provide: ExchangeOracleGateway, useValue: exchangeOracleGatewayMock },
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
      (
        exchangeOracleGatewayMock.postNewJobAssignment as jest.Mock
      ).mockResolvedValue({
        assignment_id: '123',
      });

      const result = await service.processJobAssignment(command);

      expect(
        exchangeOracleGatewayMock.postNewJobAssignment,
      ).toHaveBeenCalledWith(command);
      expect(result).toEqual({ assignment_id: '123' });
    });
  });

  describe('processGetAssignedJobs', () => {
    it('should fetch assigned jobs correctly', async () => {
      const command = jobsFetchParamsCommandFixture;

      (
        exchangeOracleGatewayMock.fetchAssignedJobs as jest.Mock
      ).mockResolvedValue({
        data: [],
      });

      const result = await service.processGetAssignedJobs(command);

      expect(exchangeOracleGatewayMock.fetchAssignedJobs).toHaveBeenCalledWith(
        command,
      );
      expect(result).toEqual({ data: [] });
    });
  });
});
