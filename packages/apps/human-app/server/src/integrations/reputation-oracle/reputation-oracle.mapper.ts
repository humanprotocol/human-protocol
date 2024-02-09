import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { createMap, Mapper } from '@automapper/core';
import {
  SignupOperatorCommand,
  SignupOperatorData,
} from '../../modules/user-operator/interfaces/operator-registration.interface';
import {
  SignupWorkerCommand,
  SignupWorkerData,
} from '../../modules/user-worker/interfaces/worker-registration.interface';

@Injectable()
export class ReputationOracleProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, SignupWorkerCommand, SignupWorkerData);
      createMap(mapper, SignupOperatorCommand, SignupOperatorData);
    };
  }
}
