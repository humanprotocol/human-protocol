import { Injectable } from '@nestjs/common';
import { ExternalApiName } from '../enums/external-api-name';
import { EndpointName } from '../enums/endpoint-name';
import { GatewayConfig, Gateways } from '../interfaces/endpoint.interface';
import { EnvironmentConfigService } from './environment-config.service';
import { HttpMethod } from '../enums/http-method';

@Injectable()
export class GatewayConfigService {
  JSON_HEADER = {
    'Content-Type': 'application/json',
  };
  constructor(private envConfig: EnvironmentConfigService) {}

  private getGatewaysConfig(): Gateways {
    return {
      gateways: {
        [ExternalApiName.REPUTATION_ORACLE]: {
          url: this.envConfig.reputationOracleUrl,
          endpoints: {
            [EndpointName.WORKER_SIGNUP]: {
              endpoint: '/auth/signup',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [EndpointName.OPERATOR_SIGNUP]: {
              endpoint: '/auth/web3/signup',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [EndpointName.WORKER_SIGNIN]: {
              endpoint: '/auth/signin',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
          },
        },
      },
    };
  }
  getConfig(gateway: ExternalApiName): GatewayConfig {
    return this.getGatewaysConfig().gateways[gateway];
  }
}
