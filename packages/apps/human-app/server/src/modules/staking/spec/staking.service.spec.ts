import { Test, TestingModule } from '@nestjs/testing';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { StakingService } from '../staking.service';
import { stakeSummaryResponseFixture, TOKEN } from './staking.fixtures';

describe('StakingService', () => {
  let service: StakingService;
  let reputationOracleMock: Partial<ReputationOracleGateway>;

  beforeEach(async () => {
    reputationOracleMock = {
      getStakeSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StakingService,
        { provide: ReputationOracleGateway, useValue: reputationOracleMock },
      ],
    }).compile();

    service = module.get<StakingService>(StakingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStakeSummary', () => {
    it('should retrieve stake summary', async () => {
      (reputationOracleMock.getStakeSummary as jest.Mock).mockResolvedValue(
        stakeSummaryResponseFixture,
      );
      const result = await service.getStakeSummary(TOKEN);
      expect(reputationOracleMock.getStakeSummary).toHaveBeenCalledWith(TOKEN);
      expect(result).toEqual(stakeSummaryResponseFixture);
    });
  });
});
