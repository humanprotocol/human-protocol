import { Injectable } from '@nestjs/common';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle.gateway';
import { SignupWorkerDto } from '../../interfaces/signup-worker-request.dto';
import { InjectMapper } from '@automapper/nestjs';
import { SignupWorkerCommand } from './auth-worker.command';
import { Mapper } from '@automapper/core';

@Injectable()
export class AuthWorkerService {
  constructor(
    private reputationOracleService: ReputationOracleGateway,
    @InjectMapper() private readonly mapper: Mapper,
  ) {}

  async signupWorker(signupWorkerDto: SignupWorkerDto) {
    const signupWorkerCommand = this.mapper.map(
      signupWorkerDto,
      SignupWorkerDto,
      SignupWorkerCommand,
    );
    return this.reputationOracleService.signupWorker(signupWorkerCommand);
  }
}
