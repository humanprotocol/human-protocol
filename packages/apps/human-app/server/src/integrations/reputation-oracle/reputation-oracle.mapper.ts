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
import {
  PrepareSignatureCommand,
  PrepareSignatureData,
} from '../../modules/prepare-signature/model/prepare-signature.model';
import {
  DisableOperatorData,
  DisableOperatorParams,
} from '../../modules/disable-operator/model/disable-operator.model';
import {
  RestorePasswordCommand,
  RestorePasswordData,
} from '../../modules/password-reset/model/restore-password.model';
import {
  ForgotPasswordCommand,
  ForgotPasswordData,
} from '../../modules/password-reset/model/forgot-password.model';
import {
  ResendEmailVerificationData,
  ResendEmailVerificationParams,
} from '../../modules/email-confirmation/model/resend-email-verification.model';
import {
  EmailVerificationCommand,
  EmailVerificationData,
} from '../../modules/email-confirmation/model/email-verification.model';

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
      createMap(mapper, PrepareSignatureCommand, PrepareSignatureData);
      createMap(mapper, DisableOperatorParams, DisableOperatorData);
      createMap(mapper, RestorePasswordCommand, RestorePasswordData);
      createMap(mapper, ForgotPasswordCommand, ForgotPasswordData);
      createMap(
        mapper,
        ResendEmailVerificationParams,
        ResendEmailVerificationData,
      );
      createMap(mapper, EmailVerificationCommand, EmailVerificationData);
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
