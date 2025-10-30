import { Test, TestingModule } from '@nestjs/testing';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { ExchangeApiKeysService } from '../exchange-api-keys.service';
import {
  enrollExchangeApiKeysCommandFixture,
  enrollExchangeApiKeysResponseFixture,
  retrieveExchangeApiKeysResponseFixture,
  TOKEN,
} from './exchange-api-keys.fixtures';

describe('ExchangeApiKeysService', () => {
  let service: ExchangeApiKeysService;
  let reputationOracleMock: Partial<ReputationOracleGateway>;

  beforeEach(async () => {
    reputationOracleMock = {
      enrollExchangeApiKeys: jest.fn(),
      deleteExchangeApiKeys: jest.fn(),
      retrieveExchangeApiKeys: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeApiKeysService,
        { provide: ReputationOracleGateway, useValue: reputationOracleMock },
      ],
    }).compile();

    service = module.get<ExchangeApiKeysService>(ExchangeApiKeysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enroll', () => {
    it('should enroll exchange API keys and return id', async () => {
      (
        reputationOracleMock.enrollExchangeApiKeys as jest.Mock
      ).mockResolvedValue(enrollExchangeApiKeysResponseFixture);
      const result = await service.enroll(enrollExchangeApiKeysCommandFixture);
      expect(reputationOracleMock.enrollExchangeApiKeys).toHaveBeenCalledWith(
        enrollExchangeApiKeysCommandFixture,
      );
      expect(result).toEqual(enrollExchangeApiKeysResponseFixture);
    });
  });

  describe('delete', () => {
    it('should delete exchange API keys', async () => {
      (
        reputationOracleMock.deleteExchangeApiKeys as jest.Mock
      ).mockResolvedValue(undefined);
      await service.delete(TOKEN);
      expect(reputationOracleMock.deleteExchangeApiKeys).toHaveBeenCalledWith(
        TOKEN,
      );
    });
  });

  describe('retrieve', () => {
    it('should retrieve exchange API keys', async () => {
      (
        reputationOracleMock.retrieveExchangeApiKeys as jest.Mock
      ).mockResolvedValue(retrieveExchangeApiKeysResponseFixture);
      const result = await service.retrieve(TOKEN);
      expect(reputationOracleMock.retrieveExchangeApiKeys).toHaveBeenCalledWith(
        TOKEN,
      );
      expect(result).toEqual(retrieveExchangeApiKeysResponseFixture);
    });
  });
});
