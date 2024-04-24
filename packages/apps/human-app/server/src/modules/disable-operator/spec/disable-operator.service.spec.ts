import { DisableOperatorService } from '../disable-operator.service';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';
import { expect, it } from '@jest/globals';
import { PrepareSignatureCommand } from '../model/prepare-signature.model';
import {
  disableOperatorCommandFixture,
  prepareSignatureCommandFixture,
} from './disable-operator.fixtures';
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

  describe('processPrepareSignature', () => {
    it('should call sendPrepareSignature method of reputationOracleGateway', async () => {
      const command: PrepareSignatureCommand = prepareSignatureCommandFixture;
      await service.processPrepareSignature(command);
      expect(reputationOracleGateway.sendPrepareSignature).toHaveBeenCalledWith(
        command,
      );
    });
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
