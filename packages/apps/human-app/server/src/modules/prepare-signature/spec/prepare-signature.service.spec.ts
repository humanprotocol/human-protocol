import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';
import { expect, it } from '@jest/globals';
import { prepareSignatureCommandFixture } from './prepare-signature.fixtures';
import { PrepareSignatureService } from '../prepare-signature.service';
import { PrepareSignatureCommand } from '../model/prepare-signature.model';

describe('PrepareSignatureService', () => {
  let service: PrepareSignatureService;
  let reputationOracleGateway: ReputationOracleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrepareSignatureService, ReputationOracleGateway],
    })
      .overrideProvider(ReputationOracleGateway)
      .useValue(reputationOracleGatewayMock)
      .compile();

    service = module.get<PrepareSignatureService>(PrepareSignatureService);
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
});
