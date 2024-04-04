import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { UserEntity } from '../user/user.entity';
import { HttpService } from '@nestjs/axios';
import { KycSessionDto, KycStatusDto } from './kyc.dto';
import { KycRepository } from './kyc.repository';
import { KycStatus } from '../../common/enums/user';
import { firstValueFrom } from 'rxjs';
import { ErrorKyc } from '../../common/constants/errors';
import { SynapsConfigService } from '../../common/config/synaps-config.service';
import { SYNAPS_API_KEY_DISABLED } from 'src/common/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  private readonly synapsBaseURL: string;

  constructor(
    private kycRepository: KycRepository,
    private readonly httpService: HttpService,
    private readonly synapsConfigService: SynapsConfigService,
  ) {
    this.synapsBaseURL = 'https://api.synaps.io/v4';
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

    if (this.synapsConfigService.apiKey === SYNAPS_API_KEY_DISABLED) {
      const sessionId = uuidv4();
      await this.kycRepository.create({
        sessionId: sessionId,
        status: KycStatus.NONE,
        userId: userEntity.id,
      });

      return {
        sessionId: sessionId,
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
            'Api-Key': this.synapsConfigService.apiKey,
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
    if (secret !== this.synapsConfigService.webhookSecret) {
      throw new UnauthorizedException(ErrorKyc.InvalidWebhookSecret);
    }

    const { data: sessionData } = await firstValueFrom(
      await this.httpService.get(`/individual/session/${data.sessionId}`, {
        baseURL: this.synapsBaseURL,
        headers: {
          'Api-Key': this.synapsConfigService.apiKey,
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
