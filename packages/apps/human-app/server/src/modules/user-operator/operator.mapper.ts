import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { createMap, Mapper } from '@automapper/core';
import {
  SignupOperatorCommand,
  SignupOperatorDto,
} from './model/operator-registration.model';

@Injectable()
export class OperatorProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, SignupOperatorDto, SignupOperatorCommand);
    };
  }
}
