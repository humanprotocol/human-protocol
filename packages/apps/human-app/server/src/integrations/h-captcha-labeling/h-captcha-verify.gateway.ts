import { Injectable } from '@nestjs/common';
import {
  GatewayConfig,
  GatewayEndpointConfig,
} from '../../common/interfaces/endpoint.interface';
import { HttpService } from '@nestjs/axios';
import { GatewayConfigService } from '../../common/config/gateway-config.service';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { ExternalApiName } from '../../common/enums/external-api-name';
import { GatewayEndpoints } from '../../common/config/gateway-config.types';
import { RequestDataType } from '../reputation-oracle/reputation-oracle.interface';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom } from 'rxjs';
import {
  VerifyTokenApiResponse,
  VerifyTokenCommand,
  VerifyTokenParams,
} from '../../modules/h-captcha/model/verify-token.model';
import { HCaptchaLabelingVerifyEndpoints } from '../../common/enums/reputation-oracle-endpoints';
import { toCleanObjParams } from '../../common/utils/gateway-common.utils';

Injectable();
export class HCaptchaVerifyGateway {
  private readonly gatewayConfig: GatewayConfig;
  constructor(
    private httpService: HttpService,
    gatewayConfigService: GatewayConfigService,
    @InjectMapper() private readonly mapper: Mapper,
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
  private async handleRequestToHCaptchaLabelingApi<T>(
    options: AxiosRequestConfig,
  ): Promise<T> {
    const response = await lastValueFrom(this.httpService.request(options));
    return response.data;
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
      return this.handleRequestToHCaptchaLabelingApi<VerifyTokenApiResponse>(
        options,
      );
    } catch (e) {
      console.log('Error: ', e);
    }
  }
}
