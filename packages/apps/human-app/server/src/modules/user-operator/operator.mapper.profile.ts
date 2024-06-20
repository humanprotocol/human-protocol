import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { createMap, Mapper } from '@automapper/core';
import {
  SigninOperatorCommand,
  SigninOperatorDto,
  SignupOperatorCommand,
  SignupOperatorDto,
} from './model/operator.model';

@Injectable()
export class OperatorProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, SignupOperatorDto, SignupOperatorCommand);
      createMap(mapper, SigninOperatorDto, SigninOperatorCommand);
    };
  }
}
