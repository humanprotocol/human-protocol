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
  SignupOperatorCommand,
  SignupOperatorData,
} from '../../modules/user-operator/model/operator-registration.model';
import {
  SignupWorkerCommand,
  SignupWorkerData,
} from '../../modules/user-worker/model/worker-registration.model';
import {
  SigninWorkerCommand,
  SigninWorkerData,
} from '../../modules/user-worker/model/worker-signin.model';

@Injectable()
export class ReputationOracleProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap(
        mapper,
        SignupWorkerCommand,
        SignupWorkerData,
        forMember(
          (destination) => destination.h_captcha_token,
          mapFrom((source) => source.hCaptchaToken),
        ),
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
        }),
      );
      createMap(mapper, SignupOperatorCommand, SignupOperatorData);
      createMap(
        mapper,
        SigninWorkerCommand,
        SigninWorkerData,
        forMember(
          (destination) => destination.h_captcha_token,
          mapFrom((source) => source.hCaptchaToken),
        ),
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
        }),
      );
    };
  }
}
