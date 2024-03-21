import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { createMap, Mapper } from '@automapper/core';
import {
  SignupWorkerCommand,
  SignupWorkerDto,
} from './interfaces/worker-registration.interface';
import {
  SigninWorkerCommand,
  SigninWorkerDto,
} from './interfaces/worker-signin.interface';

@Injectable()
export class WorkerProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, SignupWorkerDto, SignupWorkerCommand);
      createMap(mapper, SigninWorkerDto, SigninWorkerCommand);
    };
  }
}
