import { Injectable } from '@nestjs/common';
import { ExternalApiName } from '../enums/external-api-name';
import { GatewayConfig, Gateways } from '../interfaces/endpoint.interface';
import { EnvironmentConfigService } from './environment-config.service';
import { HttpMethod } from '../enums/http-method';
import { ReputationOracleEndpoints } from '../enums/reputation-oracle-endpoints';

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
            [ReputationOracleEndpoints.WORKER_SIGNUP]: {
              endpoint: '/auth/signup',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.OPERATOR_SIGNUP]: {
              endpoint: '/auth/web3/signup',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.WORKER_SIGNIN]: {
              endpoint: '/auth/signin',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.EMAIL_VERIFICATION]: {
              endpoint: '/auth/email-verification',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.RESEND_EMAIL_VERIFICATION]: {
              endpoint: '/auth/resend-email-verification',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.FORGOT_PASSWORD]: {
              endpoint: '/auth/forgot-password',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.RESTORE_PASSWORD]: {
              endpoint: '/auth/restore-password',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.PREPARE_SIGNATURE]: {
              endpoint: '/user/prepare-signature',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.DISABLE_OPERATOR]: {
              endpoint: '/user/disable-operator',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.KYC_PROCEDURE_START]: {
              endpoint: '/kyc/start',
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
