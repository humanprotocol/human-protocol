import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import {
  CamelCaseNamingConvention,
  createMap,
  forMember,
  mapFrom,
  Mapper,
  namingConventions,
  SnakeCaseNamingConvention,
} from '@automapper/core';
import {
  SignupWorkerCommand,
  SignupWorkerDto,
} from './model/worker-registration.model';
import {
  SigninWorkerCommand,
  SigninWorkerDto,
} from './model/worker-signin.model';

@Injectable()
export class WorkerProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        SignupWorkerDto,
        SignupWorkerCommand,
        forMember(
          (destination) => destination.hCaptchaToken,
          mapFrom((source) => source.h_captcha_token),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        SigninWorkerDto,
        SigninWorkerCommand,
        forMember(
          (destination) => destination.hCaptchaToken,
          mapFrom((source) => source.h_captcha_token),
        ),
        namingConventions({
          source: new SnakeCaseNamingConvention(),
          destination: new CamelCaseNamingConvention(),
        }),
      );
    };
  }
}
