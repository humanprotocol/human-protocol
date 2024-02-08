import { Injectable } from '@nestjs/common';
import { ExternalApiName } from '../enums/external-api-name';
import { EndpointName } from '../enums/endpoint-name';
import { GatewayConfig, Gateways } from '../interfaces/endpoint.interface';
import { EnvironmentConfigService } from './environment-config.service';

@Injectable()
export class GatewayConfigService {
  constructor(private envConfig: EnvironmentConfigService) {}

  private getGatewaysConfig(): Gateways {
    return {
      gateways: {
        [ExternalApiName.REPUTATION_ORACLE]: {
          url: this.envConfig.reputationOracleUrl!,
          endpoints: {
            [EndpointName.WORKER_SIGNUP]: {
              endpoint: '/auth/signup',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            },
            [EndpointName.OPERATOR_SIGNUP]: {
              endpoint: '/auth/signup',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
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
