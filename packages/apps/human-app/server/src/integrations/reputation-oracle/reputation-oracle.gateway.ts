import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import {
  SignupWorkerCommand,
  SignupWorkerData,
} from '../../modules/user-worker/interfaces/worker-registration.interface';
import {
  SignupOperatorCommand,
  SignupOperatorData,
} from '../../modules/user-operator/interfaces/operator-registration.interface';
import { GatewayConfigService } from '../../common/config/gateway-config.service';
import { GatewayConfig } from '../../common/interfaces/endpoint.interface';
import { ExternalApiName } from '../../common/enums/external-api-name';
import { EndpointName } from '../../common/enums/endpoint-name';
import { AxiosRequestConfig } from 'axios';
import { RequestDataType } from './reputation-oracle.interface';
import {
  SigninWorkerCommand,
  SigninWorkerData,
  SigninWorkerResponse,
} from '../../modules/user-worker/interfaces/worker-signin.interface';

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
  ) {
    const { method, endpoint, headers } =
      this.reputationOracleConfig.endpoints[endpointName];
    return {
      method: method,
      url: `${this.reputationOracleConfig.url}${endpoint}`,
      headers: headers,
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
}
