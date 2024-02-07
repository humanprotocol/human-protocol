import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { createMap, Mapper } from '@automapper/core';
import {
  SignupWorkerCommand,
  SignupWorkerData,
  SignupWorkerDto,
} from './interfaces/worker-registration.interface';

@Injectable()
export class AuthWorkerProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, SignupWorkerDto, SignupWorkerCommand);
      createMap(mapper, SignupWorkerCommand, SignupWorkerData);
    };
  }
}
