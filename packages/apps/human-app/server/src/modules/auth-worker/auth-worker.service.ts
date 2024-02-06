import { Injectable } from '@nestjs/common';
import { ReputationOracleService } from '../../integrations/reputation-oracle.service';
import {
  SignupWorkerDto,
  WorkerType,
} from '../../interfaces/signup-worker-request.dto';

@Injectable()
export class AuthWorkerService {
  constructor(private reputationOracleService: ReputationOracleService) {}

  async signupWorker(signupWorkerDto: SignupWorkerDto) {
    signupWorkerDto.type = WorkerType.WORKER;
    return this.reputationOracleService.signupWorker(signupWorkerDto);
  }
}
