import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { ConfigNames } from '../../common/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { KYCSessionDto, KYCStatusDto } from './kyc.dto';

@Injectable()
export class KYCService {
  private readonly logger = new Logger(KYCService.name);
  private readonly synapsBaseURL: string;
  private readonly synapsApiKey: string;
  private readonly synapsWebhookSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.synapsBaseURL = 'https://api.synaps.io/v4';

    this.synapsApiKey = this.configService.get<string>(
      ConfigNames.SYNAPS_API_KEY,
      '',
    );

    this.synapsWebhookSecret = this.configService.get<string>(
      ConfigNames.SYNAPS_WEBHOOK_SECRET,
      '',
    );
  }

  private async synapsAPIRequest<T>(
    method: string,
    url: string,
    data: any,
  ): Promise<AxiosResponse<T>> {
    return this.httpService.axiosRef
      .request({
        method,
        url,
        data,
        baseURL: this.synapsBaseURL,
        headers: {
          'Api-Key': this.synapsApiKey,
        },
      })
      .catch((err) => {
        this.logger.error(err);
        throw err;
      });
  }

  public async initSession(userEntity: UserEntity): Promise<KYCSessionDto> {
    if (userEntity.kycSessionId) {
      throw new BadRequestException('User already has an active KYC session');
    }

    const { data } = await this.synapsAPIRequest<{ session_id: string }>(
      'POST',
      'session/init',
      {
        alias: userEntity.email,
      },
    );

    await this.userService.startKYC(userEntity, data.session_id);

    return {
      sessionId: data.session_id,
    };
  }

  public async updateKYCStatus(
    secret: string,
    data: KYCStatusDto,
  ): Promise<void> {
    if (secret !== this.synapsWebhookSecret) {
      throw new UnauthorizedException('Invalid secret');
    }
    await this.userService.updateKYCStatus(data.sessionId, data.state);
  }
}
