import { Test, TestingModule } from '@nestjs/testing';
import { TokenRefreshService } from '../token-refresh.service';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';

describe('RefreshTokenService', () => {
  let service: TokenRefreshService;
  let reputationOracleGateway: ReputationOracleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenRefreshService, ReputationOracleGateway],
    })
      .overrideProvider(ReputationOracleGateway)
      .useValue(reputationOracleGatewayMock)
      .compile();

    service = module.get<TokenRefreshService>(TokenRefreshService);
    reputationOracleGateway = module.get<ReputationOracleGateway>(
      ReputationOracleGateway,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('refresh token', () => {
    it('should call reputation oracle gateway without doing anything else', async () => {
      const command = {
        refreshToken: 'token',
      };
      await service.refreshToken(command);
      expect(reputationOracleGateway.sendRefreshToken).toHaveBeenCalledWith(
        command,
      );
    });
  });
});
