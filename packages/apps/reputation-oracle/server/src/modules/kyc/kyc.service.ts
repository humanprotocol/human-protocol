import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserEntity } from '../user/user.entity';
import { ConfigNames } from '../../common/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { KycSessionDto, KycStatusDto } from './kyc.dto';
import { KycRepository } from './kyc.repository';
import { KycStatus } from '../../common/enums/user';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly synapsBaseURL: string;
  private readonly synapsApiKey: string;
  private readonly synapsWebhookSecret: string;

  constructor(
    private kycRepository: KycRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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

  public async initSession(userEntity: UserEntity): Promise<KycSessionDto> {
    if (userEntity.kyc.sessionId) {
      return {
        sessionId: userEntity.kyc.sessionId,
      };
    }

    const { data } = await this.synapsAPIRequest<{ session_id: string }>(
      'POST',
      'session/init',
      {
        alias: userEntity.email,
      },
    );

    await this.kycRepository.create({
      sessionId: data.session_id,
      status: KycStatus.NONE,
      userId: userEntity.id,
    });

    return {
      sessionId: data.session_id,
    };
  }

  public async updateKycStatus(
    secret: string,
    data: KycStatusDto,
  ): Promise<void> {
    if (secret !== this.synapsWebhookSecret) {
      throw new UnauthorizedException('Invalid secret');
    }

    await this.kycRepository.updateOne(
      {
        sessionId: data.sessionId,
      },
      {
        status: data.state,
      },
    );
  }
}
