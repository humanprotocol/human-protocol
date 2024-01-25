import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserEntity } from '../user/user.entity';
import { ConfigNames } from '../../common/config';
import { HttpService } from '@nestjs/axios';
import { KycSessionDto, KycStatusDto } from './kyc.dto';
import { KycRepository } from './kyc.repository';
import { KycStatus } from '../../common/enums/user';
import { firstValueFrom } from 'rxjs';
import { ErrorKyc } from '../../common/constants/errors';

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

  public async initSession(userEntity: UserEntity): Promise<KycSessionDto> {
    if (userEntity.kyc?.sessionId) {
      if (userEntity.kyc.status === KycStatus.APPROVED) {
        throw new BadRequestException(ErrorKyc.AlreadyApproved);
      }

      if (userEntity.kyc.status === KycStatus.PENDING_VERIFICATION) {
        throw new BadRequestException(ErrorKyc.VerificationInProgress);
      }

      if (userEntity.kyc.status === KycStatus.REJECTED) {
        throw new BadRequestException(
          `${ErrorKyc.Rejected}. Reason: ${userEntity.kyc.message}`,
        );
      }

      return {
        sessionId: userEntity.kyc.sessionId,
      };
    }

    const { data } = await firstValueFrom(
      await this.httpService.post(
        'session/init',
        {
          alias: userEntity.email,
        },
        {
          baseURL: this.synapsBaseURL,
          headers: {
            'Api-Key': this.synapsApiKey,
          },
        },
      ),
    );

    if (!data?.session_id) {
      throw new InternalServerErrorException(ErrorKyc.InvalidSynapsAPIResponse);
    }

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
      throw new UnauthorizedException(ErrorKyc.InvalidWebhookSecret);
    }

    const { data: sessionData } = await firstValueFrom(
      await this.httpService.get(`/individual/session/${data.sessionId}`, {
        baseURL: this.synapsBaseURL,
        headers: {
          'Api-Key': this.synapsApiKey,
        },
      }),
    );

    if (
      !sessionData?.session?.status ||
      sessionData.session.status !== data.state
    ) {
      throw new InternalServerErrorException(ErrorKyc.InvalidSynapsAPIResponse);
    }

    await this.kycRepository.updateOne(
      {
        sessionId: data.sessionId,
      },
      {
        status: data.state,
        message: data.reason,
      },
    );
  }
}
