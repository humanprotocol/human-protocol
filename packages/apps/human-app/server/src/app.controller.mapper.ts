import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { createMap, Mapper } from '@automapper/core';
import {
  SignupOperatorCommand,
  SignupOperatorDto,
} from './modules/operator/interfaces/operator-registration.interface';
import { SignupWorkerCommand, SignupWorkerDto } from "./modules/user-worker/interfaces/worker-registration.interface";

@Injectable()
export class ControllerProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, SignupWorkerDto, SignupWorkerCommand);
      createMap(mapper, SignupOperatorDto, SignupOperatorCommand);
    };
  }
}
