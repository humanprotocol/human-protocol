import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { SignupWorkerCommand } from './model/worker-registration.model';
import { SigninWorkerCommand } from './model/worker-signin.model';

@Injectable()
export class WorkerService {
  constructor(private reputationOracleService: ReputationOracleGateway) {}

  async signupWorker(signupWorkerCommand: SignupWorkerCommand) {
    return this.reputationOracleService.sendWorkerSignup(signupWorkerCommand);
  }
  async signinWorker(signinWorkerCommand: SigninWorkerCommand) {
    return this.reputationOracleService.sendWorkerSignin(signinWorkerCommand);
  }
}
