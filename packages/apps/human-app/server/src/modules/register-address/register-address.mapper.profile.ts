import { Injectable } from '@nestjs/common';
import {
  CamelCaseNamingConvention,
  createMap,
  Mapper,
  namingConventions,
  SnakeCaseNamingConvention,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import {
  RegisterAddressCommand,
  RegisterAddressDto,
} from './model/register-address.model';

@Injectable()
export class RegisterAddressProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        RegisterAddressDto,
        RegisterAddressCommand,
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
    };
  }
}
