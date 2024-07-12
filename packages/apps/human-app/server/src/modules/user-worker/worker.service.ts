import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { SignupWorkerCommand } from './model/worker-registration.model';
import { SigninWorkerCommand } from './model/worker-signin.model';

@Injectable()
export class WorkerService {
  constructor(private gateway: ReputationOracleGateway) {}

  async signupWorker(signupWorkerCommand: SignupWorkerCommand) {
    return this.gateway.sendWorkerSignup(signupWorkerCommand);
  }
  async signinWorker(signinWorkerCommand: SigninWorkerCommand) {
    return this.gateway.sendWorkerSignin(signinWorkerCommand);
  }
}
