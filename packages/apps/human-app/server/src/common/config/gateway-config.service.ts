import { Injectable } from '@nestjs/common';
import { ExternalApiName } from '../enums/external-api-name';
import {
  HCaptchaLabelingStatsEndpoints,
  HCaptchaLabelingVerifyEndpoints,
  ReputationOracleEndpoints,
} from '../enums/reputation-oracle-endpoints';
import {
  GatewayConfig,
  GatewayEndpointConfig,
  Gateways,
} from '../interfaces/endpoint.interface';
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
            [ReputationOracleEndpoints.WORKER_SIGNUP]: {
              endpoint: '/auth/web2/signup',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.OPERATOR_SIGNUP]: {
              endpoint: '/auth/web3/signup',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.WORKER_SIGNIN]: {
              endpoint: '/auth/web2/signin',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.M2M_SIGNIN]: {
              endpoint: '/auth/m2m/signin',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.REGISTRATION_IN_EXCHANGE_ORACLE]: {
              endpoint: '/user/exchange-oracle-registration',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.EMAIL_VERIFICATION]: {
              endpoint: '/auth/web2/verify-email',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.RESEND_EMAIL_VERIFICATION]: {
              endpoint: '/auth/web2/resend-verification-email',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.FORGOT_PASSWORD]: {
              endpoint: '/auth/web2/forgot-password',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.RESTORE_PASSWORD]: {
              endpoint: '/auth/web2/restore-password',
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
            [ReputationOracleEndpoints.ENABLE_OPERATOR]: {
              endpoint: '/user/enable-operator',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.KYC_PROCEDURE_START]: {
              endpoint: '/kyc/start',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.ENABLE_LABELING]: {
              endpoint: '/user/register-labeler',
              method: HttpMethod.POST,
            },
            [ReputationOracleEndpoints.OPERATOR_SIGNIN]: {
              endpoint: '/auth/web3/signin',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.REGISTER_ADDRESS]: {
              endpoint: '/user/register-address',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.TOKEN_REFRESH]: {
              endpoint: '/auth/refresh',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.KYC_ON_CHAIN]: {
              endpoint: '/kyc/on-chain',
              method: HttpMethod.GET,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.GET_REGISTRATION_IN_EXCHANGE_ORACLES]: {
              endpoint: '/user/exchange-oracle-registration',
              method: HttpMethod.GET,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.GET_LATEST_NDA]: {
              endpoint: '/nda/latest',
              method: HttpMethod.GET,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.SIGN_NDA]: {
              endpoint: '/nda/sign',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.REPORT_ABUSE]: {
              endpoint: '/abuse/report',
              method: HttpMethod.POST,
              headers: this.JSON_HEADER,
            },
            [ReputationOracleEndpoints.GET_ABUSE_REPORTS]: {
              endpoint: '/abuse/reports',
              method: HttpMethod.GET,
              headers: this.JSON_HEADER,
            },
          } as Record<ReputationOracleEndpoints, GatewayEndpointConfig>,
        },
        [ExternalApiName.HCAPTCHA_LABELING_STATS]: {
          url: this.envConfig.hcaptchaLabelingStatsApiUrl,
          endpoints: {
            [HCaptchaLabelingStatsEndpoints.USER_STATS]: {
              endpoint: '/support/labeler/', // email to append as url param
              method: HttpMethod.GET,
              params: {
                api_key: this.envConfig.hcaptchaLabelingApiKey,
              },
            },
            [HCaptchaLabelingStatsEndpoints.DAILY_HMT_SPENT]: {
              endpoint: '/requester/daily_hmt_spend',
              method: HttpMethod.GET,
              params: {
                api_key: this.envConfig.hcaptchaLabelingApiKey,
                actual: false,
                /**
                 * Required param.
                 * Only one value is available for now
                 * so hardcoded
                 */
                network: 'polygon',
              },
            },
          } as Record<HCaptchaLabelingStatsEndpoints, GatewayEndpointConfig>,
        },
        [ExternalApiName.HCAPTCHA_LABELING_VERIFY]: {
          url: this.envConfig.hcaptchaLabelingVerifyApiUrl,
          endpoints: {
            [HCaptchaLabelingVerifyEndpoints.TOKEN_VERIFY]: {
              endpoint: '/siteverify',
              method: HttpMethod.POST,
              // params in this method are dynamic
            },
          } as Record<HCaptchaLabelingVerifyEndpoints, GatewayEndpointConfig>,
        },
      },
    };
  }
  getConfig(gateway: ExternalApiName): GatewayConfig {
    return this.getGatewaysConfig().gateways[gateway];
  }
}
