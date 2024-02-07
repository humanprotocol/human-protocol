import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
  SignupOperatorData
} from "../../modules/operator/interfaces/operator-registration.interface";
import { GatewayConfigService } from "../gateway-config.service";
import { GatewayConfig } from "../../common/config/enpoint.interface";

@Injectable()
export class ReputationOracleGateway {
  private reputationOracleConfig: GatewayConfig;
  constructor(
    private httpService: HttpService,
    gatewayConfigService: GatewayConfigService,
    @InjectMapper() private readonly mapper: Mapper,
  ) {
    this.reputationOracleConfig = gatewayConfigService.getConfig('reputation_oracle');
  }
  getEndpointOptions<dataType>(endpointName: string, data: dataType) {
    const endpointConfig = this.reputationOracleConfig.endpoints[endpointName];
    return {
      method: endpointConfig.method,
      url: this.reputationOracleConfig + endpointConfig.endpoint,
      headers : endpointConfig.headers,
      data: data,
    };
  }
  async sendWorkerSignup(command: SignupWorkerCommand): Promise<void> {
    const signupWorkerData = this.mapper.map(
      command,
      SignupWorkerCommand,
      SignupWorkerData,
    );

    try {
      const options = this.getEndpointOptions<SignupWorkerData>('workerSignup', signupWorkerData);
      const response = await lastValueFrom(this.httpService.request(options));
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      } else {
        throw new HttpException(
          'Error occurred while redirecting request.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async sendOperatorSignup(command: SignupOperatorCommand): Promise<void> {
    const signupOperatorData = this.mapper.map(
      command,
      SignupOperatorCommand,
      SignupOperatorData,
    );
    // todo: Endpoint name should be an enum
    // todo: is the logic during processing operator same as worker?
    const options = this.getEndpointOptions<SignupOperatorData>('operatorSignup', signupOperatorData); // todo: Operations as a type

    try {
      const response = await lastValueFrom(this.httpService.request(options)); // todo: extract this to a method
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      } else {
        throw new HttpException(
          'Error occurred while redirecting request.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
