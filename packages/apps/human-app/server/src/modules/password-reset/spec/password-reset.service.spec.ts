import { PasswordResetService } from '../password-reset.service';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';
import { expect, it } from '@jest/globals';
import { ForgotPasswordCommand } from '../model/forgot-password.model';
import {
  forgotPasswordCommandFixture,
  restorePasswordCommandFixture,
} from './password-reset.fixtures';
import { RestorePasswordCommand } from '../model/restore-password.model';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let reputationOracleGateway: ReputationOracleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordResetService, ReputationOracleGateway],
    })
      .overrideProvider(ReputationOracleGateway)
      .useValue(reputationOracleGatewayMock)
      .compile();
    service = module.get<PasswordResetService>(PasswordResetService);
    reputationOracleGateway = module.get<ReputationOracleGateway>(
      ReputationOracleGateway,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processForgotPassword', () => {
    it('should call sendForgotPassword method of reputationOracleGateway', async () => {
      const command: ForgotPasswordCommand = forgotPasswordCommandFixture;
      await service.processForgotPassword(command);
      expect(reputationOracleGateway.sendForgotPassword).toHaveBeenCalledWith(
        command,
      );
    });
  });
  describe('processRestorePassword', () => {
    it('should call sendRestorePassword method of reputationOracleGateway', async () => {
      const command: RestorePasswordCommand = restorePasswordCommandFixture;
      await service.processRestorePassword(command);
      expect(reputationOracleGateway.sendRestorePassword).toHaveBeenCalledWith(
        command,
      );
    });
  });
});
