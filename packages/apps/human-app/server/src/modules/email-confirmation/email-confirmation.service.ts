import { Injectable } from '@nestjs/common';
import { EmailVerificationCommand } from './model/email-verification.model';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { ResendEmailVerificationCommand } from './model/resend-email-verification.model';

@Injectable()
export class EmailConfirmationService {
  constructor(private gateway: ReputationOracleGateway) {}

  async processEmailVerification(
    command: EmailVerificationCommand,
  ): Promise<void> {
    return this.gateway.sendEmailVerification(command);
  }

  async processResendEmailVerification(
    command: ResendEmailVerificationCommand,
  ): Promise<void> {
    return this.gateway.sendResendEmailVerification(command);
  }
}
