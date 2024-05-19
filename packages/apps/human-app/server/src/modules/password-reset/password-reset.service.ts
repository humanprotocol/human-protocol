import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { ForgotPasswordCommand } from './model/forgot-password.model';
import { RestorePasswordCommand } from './model/restore-password.model';

@Injectable()
export class PasswordResetService {
  constructor(private gateway: ReputationOracleGateway) {}

  async processForgotPassword(command: ForgotPasswordCommand): Promise<void> {
    return this.gateway.sendForgotPassword(command);
  }

  async processRestorePassword(command: RestorePasswordCommand): Promise<void> {
    return this.gateway.sendRestorePassword(command);
  }
}
