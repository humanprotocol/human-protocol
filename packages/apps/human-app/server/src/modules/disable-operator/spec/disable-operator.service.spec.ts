import { DisableOperatorService } from '../disable-operator.service';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';
import { expect, it } from '@jest/globals';
import { disableOperatorCommandFixture } from './disable-operator.fixtures';
import { DisableOperatorCommand } from '../model/disable-operator.model';

describe('DisableOperatorService', () => {
  let service: DisableOperatorService;
  let reputationOracleGateway: ReputationOracleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisableOperatorService, ReputationOracleGateway],
    })
      .overrideProvider(ReputationOracleGateway)
      .useValue(reputationOracleGatewayMock)
      .compile();

    service = module.get<DisableOperatorService>(DisableOperatorService);
    reputationOracleGateway = module.get<ReputationOracleGateway>(
      ReputationOracleGateway,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processDisableOperator', () => {
    it('should call sendDisableOperator method of reputationOracleGateway', async () => {
      const command: DisableOperatorCommand = disableOperatorCommandFixture;
      await service.processDisableOperator(command);
      expect(reputationOracleGateway.sendDisableOperator).toHaveBeenCalledWith(
        command,
      );
    });
  });
});
