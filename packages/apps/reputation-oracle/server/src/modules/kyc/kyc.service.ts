import { Injectable, Logger } from '@nestjs/common';
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

  public async updateKYCStatus(data: KYCStatusDto): Promise<void> {
    await this.userService.updateKYCStatus(data.sessionId, data.status);
  }
}
