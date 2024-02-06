import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { createMap, Mapper } from '@automapper/core';
import { SignupWorkerDto } from '../../interfaces/signup-worker-request.dto';
import { SignupWorkerCommand } from './auth-worker.command';

@Injectable()
export class AuthWorkerProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, SignupWorkerDto, SignupWorkerCommand);
    };
  }
}
