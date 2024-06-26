import { Injectable, Logger } from '@nestjs/common';
import {
  hCaptchaGetLabeler,
  hCaptchaRegisterLabeler,
  hCaptchaVerifyToken,
} from './hcaptcha.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { HCaptchaConfigService } from '../../common/config/hcaptcha-config.service';

@Injectable()
export class HCaptchaService {
  private readonly logger = new Logger(HCaptchaService.name);

  constructor(
    private httpService: HttpService,
    private readonly hcaptchaConfigService: HCaptchaConfigService,
  ) {}

  /**
   * Verifies the hCaptcha token.
   * @param {hCaptchaVerifyToken} data - The data required for token verification.
   * @returns {Promise<any>} - The verification result.
   */
  public async verifyToken(data: hCaptchaVerifyToken): Promise<any> {
    try {
      const { ip, token } = data;

      const queryParams: any = {
        secret: this.hcaptchaConfigService.secret,
        sitekey: this.hcaptchaConfigService.siteKey,
        response: token,
      };

      if (ip) {
        queryParams.remoteip = ip;
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.hcaptchaConfigService.protectionURL}/siteverify`,
          {},
          { params: queryParams },
        ),
      );

      if (
        response &&
        response.data.success === true &&
        response.status === 200
      ) {
        return response.data;
      } else if (response && response.data.success === false) {
        this.logger.error(
          `Error occurred during token verification: ${response.data['error-codes']}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error occurred during token verification: ${error}`);
    }

    return false;
  }

  /**
   * Registers a user as a labeler at hCaptcha Foundation.
   * @param {hCaptchaRegisterLabeler} data - The data required for user registration.
   * @returns {Promise<boolean>} - True if registration is successful, false otherwise.
   */
  async registerLabeler(data: hCaptchaRegisterLabeler): Promise<boolean> {
    try {
      const { ip, email, language, country, address } = data;

      if (!country) {
        this.logger.error(`Country is not set for the user`);
      }

      const queryParams: any = {
        api_key: this.hcaptchaConfigService.apiKey,
        remoteip: ip || undefined,
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.hcaptchaConfigService.labelingURL}/labeler/register`,
          {
            email,
            language,
            country,
            eth_addr: address,
          },
          {
            params: queryParams,
          },
        ),
      );

      if (response && response.status === 200) {
        return true;
      }
    } catch (error) {
      this.logger.error(
        `Error occurred during labeling registration. User: ${data.email}`,
        error,
      );
    }

    return false;
  }

  /**
   * Retrieves labeler data from hCaptcha Foundation.
   * @param {hCaptchaGetLabeler} data - The data required to retrieve labeler data.
   * @returns {Promise<any>} - The labeler data.
   */
  async getLabelerData(data: hCaptchaGetLabeler): Promise<any> {
    try {
      const { email } = data;

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.hcaptchaConfigService.labelingURL}/support/users`,
          {
            params: { api_key: this.hcaptchaConfigService.apiKey, email },
          },
        ),
      );

      if (response && response.data && response.status === 200) {
        return response.data;
      }
    } catch (error) {
      this.logger.error(
        `Error occurred while retrieving labeler data. User: ${data.email}`,
        error,
      );
    }

    return null;
  }
}
