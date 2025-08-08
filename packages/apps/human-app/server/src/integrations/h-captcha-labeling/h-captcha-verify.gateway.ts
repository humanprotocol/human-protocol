import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import { GatewayConfigService } from '../../common/config/gateway-config.service';
import { GatewayEndpoints } from '../../common/config/gateway-config.types';
import { ExternalApiName } from '../../common/enums/external-api-name';
import { HCaptchaLabelingVerifyEndpoints } from '../../common/enums/reputation-oracle-endpoints';
import {
  GatewayConfig,
  GatewayEndpointConfig,
} from '../../common/interfaces/endpoint.interface';
import { toCleanObjParams } from '../../common/utils/gateway-common.utils';
import logger from '../../logger';
import * as errorUtils from '../../common/utils/error';
import {
  VerifyTokenApiResponse,
  VerifyTokenCommand,
  VerifyTokenParams,
} from '../../modules/h-captcha/model/verify-token.model';
import { RequestDataType } from '../reputation-oracle/reputation-oracle.interface';

@Injectable()
export class HCaptchaVerifyGateway {
  private readonly gatewayConfig: GatewayConfig;
  private readonly logger = logger.child({
    context: HCaptchaVerifyGateway.name,
  });

  constructor(
    private readonly httpService: HttpService,
    gatewayConfigService: GatewayConfigService,
  ) {
    this.gatewayConfig = gatewayConfigService.getConfig(
      ExternalApiName.HCAPTCHA_LABELING_VERIFY,
    );
  }

  private getEndpointOptions(
    endpointName: GatewayEndpoints,
    data?: RequestDataType,
    token?: string,
  ): AxiosRequestConfig {
    const endpointConfig: GatewayEndpointConfig =
      this.gatewayConfig.endpoints[endpointName];
    const authHeader = token ? { Authorization: token } : {};
    return {
      method: endpointConfig.method,
      url: `${this.gatewayConfig.url}${endpointConfig.endpoint}`,
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

  async sendTokenToVerify(
    command: VerifyTokenCommand,
  ): Promise<VerifyTokenApiResponse | undefined> {
    try {
      const options = this.getEndpointOptions(
        HCaptchaLabelingVerifyEndpoints.TOKEN_VERIFY,
        {},
        command.jwtToken,
      );
      const params = {
        sitekey: command.sitekey,
        response: command.response,
        secret: command.secret,
      } as VerifyTokenParams;
      options.params = toCleanObjParams(params, options.params);

      const response = await lastValueFrom(
        this.httpService.request<VerifyTokenApiResponse>(options),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error while sending hCaptcha token for verification', {
        error: errorUtils.formatError(error),
      });
    }
  }
}
