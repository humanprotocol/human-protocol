import { Injectable } from '@nestjs/common';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import {
  CamelCaseNamingConvention,
  createMap,
  Mapper,
  namingConventions,
  SnakeCaseNamingConvention,
} from '@automapper/core';
import {
  ForgotPasswordCommand,
  ForgotPasswordData,
  ForgotPasswordDto,
} from './model/forgot-password.model';
import {
  RestorePasswordCommand,
  RestorePasswordData,
  RestorePasswordDto,
} from './model/restore-password.model';

@Injectable()
export class PasswordResetProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(mapper, ForgotPasswordDto, ForgotPasswordCommand);
      createMap(mapper, ForgotPasswordCommand, ForgotPasswordData);

      createMap(
        mapper,
        RestorePasswordDto,
        RestorePasswordCommand,
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        RestorePasswordCommand,
        RestorePasswordData,
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
        }),
      );
    };
  }
}
