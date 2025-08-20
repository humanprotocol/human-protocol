import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { firstValueFrom } from 'rxjs';

import { HCaptchaConfigService } from '@/config';
import logger from '@/logger';

import {
  GetLabelerQueryParams,
  LabelerData,
  RegisterLabelerBody,
  RegisterLabelerData,
  RegisterLabelerQueryParams,
  SiteverifyQueryParams,
  SiteverifyResponse,
} from './types';

@Injectable()
export class HCaptchaService {
  private readonly logger = logger.child({ context: HCaptchaService.name });

  constructor(
    private readonly httpService: HttpService,
    private readonly hcaptchaConfigService: HCaptchaConfigService,
  ) {}

  async verifyToken(token: string, ip?: string): Promise<boolean> {
    try {
      const queryParams: SiteverifyQueryParams = {
        secret: this.hcaptchaConfigService.secret,
        sitekey: this.hcaptchaConfigService.siteKey,
        response: token,
      };

      if (ip) {
        queryParams.remoteip = ip;
      }

      const response = await firstValueFrom(
        this.httpService.post<SiteverifyResponse | undefined>(
          `${this.hcaptchaConfigService.protectionURL}/siteverify`,
          {},
          { params: queryParams },
        ),
      );

      /**
       * WARN: Only this case is considered as "valid token"
       * since anything can change on hCaptcha side
       */
      if (response.status === 200 && response.data?.success === true) {
        return true;
      } else if (response.data?.success === false) {
        this.logger.warn('Error occurred during hCaptcha token verification', {
          errorCodes: response.data['error-codes'],
          token,
          ip,
        });
      }
    } catch (error) {
      this.logger.error('Error occurred during token verification', error);
    }

    return false;
  }

  async registerLabeler(data: RegisterLabelerData): Promise<boolean> {
    const { email, evmAddress, country, ip } = data;

    try {
      const queryParams: RegisterLabelerQueryParams = {
        api_key: this.hcaptchaConfigService.apiKey,
      };
      if (ip) {
        queryParams.remoteip = ip;
      }

      const body: RegisterLabelerBody = {
        email,
        eth_addr: ethers.getAddress(evmAddress),
        language: this.hcaptchaConfigService.defaultLabelerLang,
        country,
      };

      const response = await firstValueFrom(
        this.httpService.post<unknown>(
          `${this.hcaptchaConfigService.labelingURL}/labeler/register`,
          body,
          {
            params: queryParams,
          },
        ),
      );

      if (response.status === 200) {
        return true;
      } else {
        this.logger.warn('Non 200 response from labeling API', {
          response: {
            status: response.status,
            data: response.data,
          },
          ...data,
        });
      }
    } catch (error) {
      this.logger.error('Error occurred during labeling registration', {
        error,
        ...data,
      });
    }

    return false;
  }

  async getLabelerData(email: string): Promise<LabelerData | null> {
    const queryParams: GetLabelerQueryParams = {
      api_key: this.hcaptchaConfigService.apiKey,
      email,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get<LabelerData>(
          `${this.hcaptchaConfigService.labelingURL}/support/users`,
          {
            params: queryParams,
          },
        ),
      );

      if (response.status === 200 && response.data) {
        return response.data;
      }
    } catch (error) {
      this.logger.error(`Error occurred while retrieving labeler data`, {
        error,
        email,
      });
    }

    return null;
  }
}
