import { Injectable } from '@nestjs/common';
import { ReputationOracleService } from '../../integrations/reputation-oracle.service';
import { SignupWorkerDto } from '../../interfaces/signup-worker-request.dto';
import { InjectMapper } from '@automapper/nestjs';
import { SignupWorkerCommand } from './auth-worker.command';
import { Mapper } from '@automapper/core';

@Injectable()
export class AuthWorkerService {
  constructor(
    private reputationOracleService: ReputationOracleService,
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
