import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import {
  RegistrationInExchangeOraclesResponse,
  RegistrationInExchangeOracleCommand,
  RegistrationInExchangeOracleData,
  SignupWorkerCommand,
  SignupWorkerData,
  RegistrationInExchangeOracleResponse,
} from '../../modules/user-worker/model/worker-registration.model';
import {
  SignupOperatorCommand,
  SignupOperatorData,
} from '../../modules/user-operator/model/operator-registration.model';
import { GatewayConfigService } from '../../common/config/gateway-config.service';
import {
  GatewayConfig,
  GatewayEndpointConfig,
} from '../../common/interfaces/endpoint.interface';
import { ExternalApiName } from '../../common/enums/external-api-name';
import { ReputationOracleEndpoints } from '../../common/enums/reputation-oracle-endpoints';
import { AxiosRequestConfig } from 'axios';
import { RequestDataType } from './reputation-oracle.interface';
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
} from '../../modules/user-operator/model/disable-operator.model';
import {
  EnableOperatorCommand,
  EnableOperatorData,
  EnableOperatorParams,
} from '../../modules/user-operator/model/enable-operator.model';
import { KycProcedureStartResponse } from '../../modules/kyc-procedure/model/kyc-start.model';
import {
  EnableLabelingCommand,
  EnableLabelingResponse,
} from '../../modules/h-captcha/model/enable-labeling.model';
import {
  RegisterAddressCommand,
  RegisterAddressData,
  RegisterAddressResponse,
} from '../../modules/register-address/model/register-address.model';
import {
  TokenRefreshCommand,
  TokenRefreshData,
  TokenRefreshResponse,
} from '../../modules/token-refresh/model/token-refresh.model';
import {
  SigninOperatorCommand,
  SigninOperatorData,
  SigninOperatorResponse,
  SignupOperatorResponse,
} from '../../modules/user-operator/model/operator-signin.model';
import {
  GetNDACommand,
  GetNDAResponse,
  SignNDACommand,
  SignNDAData,
  SignNDAResponse,
} from '../../modules/nda/model/nda.model';
import {
  ReportAbuseCommand,
  ReportAbuseData,
  ReportAbuseParams,
  ReportedAbuseResponse,
} from '../../modules/abuse/model/abuse.model';

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
    endpointName: ReputationOracleEndpoints,
    data?: RequestDataType,
    token?: string,
  ): AxiosRequestConfig {
    const endpointConfig: GatewayEndpointConfig =
      this.reputationOracleConfig.endpoints[endpointName];
    const authHeader = token ? { Authorization: token } : {};
    return {
      method: endpointConfig.method,
      url: `${this.reputationOracleConfig.url}${endpointConfig.endpoint}`,
      headers: {
        ...authHeader,
        ...endpointConfig.headers,
      },
      params: {
        ...endpointConfig.params,
      },
      data: data,
    } as AxiosRequestConfig;
  }

  private async handleRequestToReputationOracle<T>(
    options: AxiosRequestConfig,
  ): Promise<T> {
    const response = await lastValueFrom(this.httpService.request(options));
    return response.data as T;
  }
  async sendWorkerSignup(command: SignupWorkerCommand): Promise<void> {
    const signupWorkerData = this.mapper.map(
      command,
      SignupWorkerCommand,
      SignupWorkerData,
    );

    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.WORKER_SIGNUP,
      signupWorkerData,
    );

    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendOperatorSignup(
    command: SignupOperatorCommand,
  ): Promise<SignupOperatorResponse> {
    const data = this.mapper.map(
      command,
      SignupOperatorCommand,
      SignupOperatorData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.OPERATOR_SIGNUP,
      data,
    );
    return this.handleRequestToReputationOracle<SignupOperatorResponse>(
      options,
    );
  }

  async sendOperatorSignin(
    command: SigninOperatorCommand,
  ): Promise<SigninOperatorResponse> {
    const data = this.mapper.map(
      command,
      SigninOperatorCommand,
      SigninOperatorData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.OPERATOR_SIGNIN,
      data,
    );
    return this.handleRequestToReputationOracle<SigninOperatorResponse>(
      options,
    );
  }

  async sendWorkerSignin(command: SigninWorkerCommand) {
    const data = this.mapper.map(
      command,
      SigninWorkerCommand,
      SigninWorkerData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.WORKER_SIGNIN,
      data,
    );
    return this.handleRequestToReputationOracle<SigninWorkerResponse>(options);
  }

  async sendM2mSignin(secretKey: string) {
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.M2M_SIGNIN,
    );
    options.headers = {
      ...options.headers,
      'human-m2m-auth-key': secretKey,
    };
    return this.handleRequestToReputationOracle<{ access_token: string }>(
      options,
    );
  }

  async sendRegistrationInExchangeOracle(
    command: RegistrationInExchangeOracleCommand,
  ) {
    const data = this.mapper.map(
      command,
      RegistrationInExchangeOracleCommand,
      RegistrationInExchangeOracleData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.REGISTRATION_IN_EXCHANGE_ORACLE,
      data,
      command.token,
    );
    return this.handleRequestToReputationOracle<RegistrationInExchangeOracleResponse>(
      options,
    );
  }

  async sendEmailVerification(command: EmailVerificationCommand) {
    const emailVerificationData = this.mapper.map(
      command,
      EmailVerificationCommand,
      EmailVerificationData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.EMAIL_VERIFICATION,
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
      ReputationOracleEndpoints.RESEND_EMAIL_VERIFICATION,
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
      ReputationOracleEndpoints.FORGOT_PASSWORD,
      forgotPasswordData,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendRestorePassword(restorePasswordCommand: RestorePasswordCommand) {
    const data = this.mapper.map(
      restorePasswordCommand,
      RestorePasswordCommand,
      RestorePasswordData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.RESTORE_PASSWORD,
      data,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendPrepareSignature(command: PrepareSignatureCommand) {
    const data = this.mapper.map(
      command,
      PrepareSignatureCommand,
      PrepareSignatureData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.PREPARE_SIGNATURE,
      data,
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
      ReputationOracleEndpoints.DISABLE_OPERATOR,
      disableOperatorData,
      disableOperatorCommand.token,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendEnableOperator(enableOperatorCommand: EnableOperatorCommand) {
    const enableOperatorData = this.mapper.map(
      enableOperatorCommand.data,
      EnableOperatorParams,
      EnableOperatorData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.ENABLE_OPERATOR,
      enableOperatorData,
      enableOperatorCommand.token,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async sendKycProcedureStart(token: string) {
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.KYC_PROCEDURE_START,
      undefined,
      token,
    );
    return this.handleRequestToReputationOracle<KycProcedureStartResponse>(
      options,
    );
  }

  async approveUserAsLabeler(command: EnableLabelingCommand) {
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.ENABLE_LABELING,
      undefined,
      command.token,
    );
    return this.handleRequestToReputationOracle<EnableLabelingResponse>(
      options,
    );
  }

  sendBlockchainAddressRegistration(
    command: RegisterAddressCommand,
  ): Promise<RegisterAddressResponse> {
    const data = this.mapper.map(
      command,
      RegisterAddressCommand,
      RegisterAddressData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.REGISTER_ADDRESS,
      data,
      command.token,
    );
    return this.handleRequestToReputationOracle<RegisterAddressResponse>(
      options,
    );
  }

  async sendRefreshToken(command: TokenRefreshCommand) {
    const data = this.mapper.map(
      command,
      TokenRefreshCommand,
      TokenRefreshData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.TOKEN_REFRESH,
      data,
    );
    return this.handleRequestToReputationOracle<TokenRefreshResponse>(options);
  }

  async getLatestNDA(command: GetNDACommand) {
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.GET_LATEST_NDA,
      undefined,
      command.token,
    );
    return this.handleRequestToReputationOracle<GetNDAResponse>(options);
  }

  async sendSignedNDA(command: SignNDACommand) {
    const data = this.mapper.map(command, SignNDACommand, SignNDAData);
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.SIGN_NDA,
      data,
      command.token,
    );
    return this.handleRequestToReputationOracle<SignNDAResponse>(options);
  }

  sendKycOnChain(token: string) {
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.KYC_ON_CHAIN,
      undefined,
      token,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async getRegistrationInExchangeOracles(
    token: string,
  ): Promise<RegistrationInExchangeOraclesResponse> {
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.GET_REGISTRATION_IN_EXCHANGE_ORACLES,
      undefined,
      token,
    );
    return this.handleRequestToReputationOracle<RegistrationInExchangeOraclesResponse>(
      options,
    );
  }

  async sendAbuseReport(command: ReportAbuseCommand) {
    const data = this.mapper.map(
      command.data,
      ReportAbuseParams,
      ReportAbuseData,
    );
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.REPORT_ABUSE,
      data,
      command.token,
    );
    return this.handleRequestToReputationOracle<void>(options);
  }

  async getAbuseReports(token: string): Promise<ReportedAbuseResponse> {
    const options = this.getEndpointOptions(
      ReputationOracleEndpoints.GET_ABUSE_REPORTS,
      undefined,
      token,
    );
    return this.handleRequestToReputationOracle<ReportedAbuseResponse>(options);
  }
}
