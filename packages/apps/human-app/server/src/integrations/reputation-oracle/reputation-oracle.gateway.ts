import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import {
  SignupWorkerCommand,
  SignupWorkerData,
} from '../../modules/user-worker/model/worker-registration.model';
import {
  SignupOperatorCommand,
  SignupOperatorData,
} from '../../modules/user-operator/model/operator-registration.model';
import { GatewayConfigService } from '../../common/config/gateway-config.service';
import { GatewayConfig } from '../../common/interfaces/endpoint.interface';
import { ExternalApiName } from '../../common/enums/external-api-name';
import { EndpointName } from '../../common/enums/endpoint-name';
import { AxiosRequestConfig } from 'axios';
import { EmptyData, RequestDataType } from './reputation-oracle.interface';
import {
  SigninWorkerCommand,
  SigninWorkerData,
  SigninWorkerResponse,
} from '../../modules/user-worker/model/worker-signin.model';
import {
  EmailVerificationCommand,
  EmailVerificationData,
} from '../../modules/email-confirmation/model/email-verification.model';
import {
  ResendEmailVerificationCommand,
  ResendEmailVerificationData,
  ResendEmailVerificationParams,
} from '../../modules/email-confirmation/model/resend-email-verification.model';
import {
  ForgotPasswordCommand,
  ForgotPasswordData,
} from '../../modules/password-reset/model/forgot-password.model';
import {
  RestorePasswordCommand,
  RestorePasswordData,
} from '../../modules/password-reset/model/restore-password.model';
import {
  PrepareSignatureCommand,
  PrepareSignatureData,
  PrepareSignatureResponse,
} from '../../modules/prepare-signature/model/prepare-signature.model';
import {
  DisableOperatorCommand,
  DisableOperatorData,
  DisableOperatorParams,
} from '../../modules/disable-operator/model/disable-operator.model';
import { KycProcedureStartResponse } from '../../modules/kyc-procedure/model/kyc-start.model';

@Injectable()
export class ReputationOracleGateway {
  private readonly reputationOracleConfig: GatewayConfig;
  constructor(
    private httpService: HttpService,
    gatewayConfigService: GatewayConfigService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {
    this.reputationOracleConfig = gatewayConfigService.getConfig(
      ExternalApiName.REPUTATION_ORACLE,
    );
  }
  private getEndpointOptions(
    endpointName: EndpointName,
    data: RequestDataType,
    token?: string,
  ) {
    const { method, endpoint, headers } =
      this.reputationOracleConfig.endpoints[endpointName];
    const authHeader = token ? { Authorization: token } : {};
    return {
      method: method,
      url: `${this.reputationOracleConfig.url}${endpoint}`,
      headers: {
        ...authHeader,
        ...headers,
      },
      data: data,
    };
  }

  private async handleRequestToReputationOracle<T>(
    options: AxiosRequestConfig,
  ): Promise<T> {
    const response = await lastValueFrom(this.httpService.request(options));
    return response.data;
  }
  async sendWorkerSignup(command: SignupWorkerCommand): Promise<void> {
    const signupWorkerData = this.mapper.map(
      command,
      SignupWorkerCommand,
      SignupWorkerData,
    );

    const options = this.getEndpointOptions(
      EndpointName.WORKER_SIGNUP,
      signupWorkerData,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendOperatorSignup(command: SignupOperatorCommand): Promise<void> {
    const signupOperatorData = this.mapper.map(
      command,
      SignupOperatorCommand,
      SignupOperatorData,
    );
    const options = this.getEndpointOptions(
      EndpointName.OPERATOR_SIGNUP,
      signupOperatorData,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendWorkerSignin(signinWorkerCommand: SigninWorkerCommand) {
    const signinWorkerData = this.mapper.map(
      signinWorkerCommand,
      SigninWorkerCommand,
      SigninWorkerData,
    );
    const options = this.getEndpointOptions(
      EndpointName.WORKER_SIGNIN,
      signinWorkerData,
    );
    return this.handleRequestToReputationOracle<SigninWorkerResponse>(options);
  }

  async sendEmailVerification(
    emailVerificationCommand: EmailVerificationCommand,
  ) {
    const emailVerificationData = this.mapper.map(
      emailVerificationCommand,
      EmailVerificationCommand,
      EmailVerificationData,
    );
    const options = this.getEndpointOptions(
      EndpointName.EMAIL_VERIFICATION,
      emailVerificationData,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendResendEmailVerification(
    resendEmailVerificationCommand: ResendEmailVerificationCommand,
  ) {
    const resendEmailVerificationData = this.mapper.map(
      resendEmailVerificationCommand.data,
      ResendEmailVerificationParams,
      ResendEmailVerificationData,
    );
    const options = this.getEndpointOptions(
      EndpointName.RESEND_EMAIL_VERIFICATION,
      resendEmailVerificationData,
      resendEmailVerificationCommand.token,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendForgotPassword(forgotPasswordCommand: ForgotPasswordCommand) {
    const forgotPasswordData = this.mapper.map(
      forgotPasswordCommand,
      ForgotPasswordCommand,
      ForgotPasswordData,
    );
    const options = this.getEndpointOptions(
      EndpointName.FORGOT_PASSWORD,
      forgotPasswordData,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendRestorePassword(restorePasswordCommand: RestorePasswordCommand) {
    const restorePasswordData = this.mapper.map(
      restorePasswordCommand,
      RestorePasswordCommand,
      RestorePasswordData,
    );
    const options = this.getEndpointOptions(
      EndpointName.RESTORE_PASSWORD,
      restorePasswordData,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendPrepareSignature(prepareSignatureCommand: PrepareSignatureCommand) {
    const prepareSignatureData = this.mapper.map(
      prepareSignatureCommand,
      PrepareSignatureCommand,
      PrepareSignatureData,
    );
    const options = this.getEndpointOptions(
      EndpointName.PREPARE_SIGNATURE,
      prepareSignatureData,
    );
    return this.handleRequestToReputationOracle<PrepareSignatureResponse>(
      options,
    );
  }

  async sendDisableOperator(disableOperatorCommand: DisableOperatorCommand) {
    const disableOperatorData = this.mapper.map(
      disableOperatorCommand.data,
      DisableOperatorParams,
      DisableOperatorData,
    );
    const options = this.getEndpointOptions(
      EndpointName.DISABLE_OPERATOR,
      disableOperatorData,
      disableOperatorCommand.token,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendKycProcedureStart() {
    const options = this.getEndpointOptions(
      EndpointName.KYC_PROCEDURE_START,
      EmptyData,
    );
    return this.handleRequestToReputationOracle<KycProcedureStartResponse>(
      options,
    );
  }
}
