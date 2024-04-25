import { EmailConfirmationService } from '../email-confirmation.service';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import { Test, TestingModule } from '@nestjs/testing';
import { reputationOracleGatewayMock } from '../../../integrations/reputation-oracle/spec/reputation-oracle.gateway.mock';
import { expect, it } from '@jest/globals';
import { EmailVerificationCommand } from '../model/email-verification.model';
import {
  emailVerificationCommandFixture,
  resendEmailVerificationCommandFixture,
} from './email-verification.fixtures';

describe('EmailConfirmationService', () => {
  let service: EmailConfirmationService;
  let reputationOracleGateway: ReputationOracleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailConfirmationService, ReputationOracleGateway],
    })
      .overrideProvider(ReputationOracleGateway)
      .useValue(reputationOracleGatewayMock)
      .compile();

    service = module.get<EmailConfirmationService>(EmailConfirmationService);
    reputationOracleGateway = module.get<ReputationOracleGateway>(
      ReputationOracleGateway,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processEmailVerification', () => {
    it('should call sendEmailVerification method of reputationOracleGateway', async () => {
      const command: EmailVerificationCommand = emailVerificationCommandFixture;
      await service.processEmailVerification(command);
      expect(
        reputationOracleGateway.sendEmailVerification,
      ).toHaveBeenCalledWith(command);
    });
  });
  describe('processResendEmailVerification', () => {
    it('should call resendSendEmailVerification method of reputationOracleGateway', async () => {
      const command = resendEmailVerificationCommandFixture;
      await service.processResendEmailVerification(command);
      expect(
        reputationOracleGateway.resendSendEmailVerification,
      ).toHaveBeenCalledWith(command);
    });
  });
});
