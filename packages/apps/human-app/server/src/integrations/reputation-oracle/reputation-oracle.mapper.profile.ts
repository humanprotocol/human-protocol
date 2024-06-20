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
  SigninOperatorCommand,
  SigninOperatorData,
  SignupOperatorCommand,
  SignupOperatorData,
} from '../../modules/user-operator/model/operator.model';
import {
  SignupWorkerCommand,
  SignupWorkerData,
} from '../../modules/user-worker/model/worker-registration.model';
import {
  SigninWorkerCommand,
  SigninWorkerData,
} from '../../modules/user-worker/model/worker-signin.model';
import {
  EnableLabelingCommand,
} from '../../modules/h-captcha/model/enable-labeling.model';
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
import {
  RegisterAddressCommand,
  RegisterAddressData,
} from '../../modules/register-address/model/register-address.model';

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
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
        }),
      );
      createMap(mapper, SignupOperatorCommand, SignupOperatorData);
      createMap(mapper, PrepareSignatureCommand, PrepareSignatureData);
      createMap(mapper, SigninOperatorCommand, SigninOperatorData);
      createMap(mapper, DisableOperatorParams, DisableOperatorData);
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
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
        }),
      );
      createMap(
        mapper,
        RegisterAddressCommand,
        RegisterAddressData,
        namingConventions({
          source: new CamelCaseNamingConvention(),
          destination: new SnakeCaseNamingConvention(),
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
