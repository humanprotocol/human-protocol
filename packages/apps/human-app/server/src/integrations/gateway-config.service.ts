import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { ExternalApiName } from '../common/enums/external-api-name';
import { EndpointName } from '../common/enums/endpoint-name';
import { GatewayConfig, Gateways } from '../common/config/endpoint.interface';

@Injectable()
export class GatewayConfigService {
  constructor(private configService: ConfigService) {}

  private getGatewaysConfig(): Gateways {
    return {
      gateways: {
        [ExternalApiName.REPUTATION_ORACLE]: {
          url: this.configService.get<string>('REPUTATION_ORACLE_URL')!,
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
