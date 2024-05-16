import { HttpStatus, Injectable } from '@nestjs/common';

import { UserEntity } from '../user/user.entity';
import { HttpService } from '@nestjs/axios';
import { KycSessionDto, KycStatusDto } from './kyc.dto';
import { KycRepository } from './kyc.repository';
import { KycStatus } from '../../common/enums/user';
import { firstValueFrom } from 'rxjs';
import { ErrorKyc } from '../../common/constants/errors';
import { SynapsConfigService } from '../../common/config/synaps-config.service';
import { SYNAPS_API_KEY_DISABLED } from '../../common/constants';
import { v4 as uuidv4 } from 'uuid';
import { KycEntity } from './kyc.entity';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class KycService {
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
        throw new ControlledError(
          ErrorKyc.AlreadyApproved,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (userEntity.kyc.status === KycStatus.PENDING_VERIFICATION) {
        throw new ControlledError(
          ErrorKyc.VerificationInProgress,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (userEntity.kyc.status === KycStatus.REJECTED) {
        throw new ControlledError(
          `${ErrorKyc.Rejected}. Reason: ${userEntity.kyc.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        sessionId: userEntity.kyc.sessionId,
      };
    }

    if (this.synapsConfigService.apiKey === SYNAPS_API_KEY_DISABLED) {
      const sessionId = uuidv4();
      const kycEntity = new KycEntity();
      kycEntity.sessionId = sessionId;
      kycEntity.status = KycStatus.NONE;
      kycEntity.userId = userEntity.id;

      await this.kycRepository.createUnique(kycEntity);

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
      throw new ControlledError(
        ErrorKyc.InvalidSynapsAPIResponse,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const kycEntity = new KycEntity();
    kycEntity.sessionId = data.session_id;
    kycEntity.status = KycStatus.NONE;
    kycEntity.userId = userEntity.id;

    await this.kycRepository.createUnique(kycEntity);

    return {
      sessionId: data.session_id,
    };
  }

  public async updateKycStatus(
    secret: string,
    data: KycStatusDto,
  ): Promise<void> {
    if (secret !== this.synapsConfigService.webhookSecret) {
      throw new ControlledError(
        ErrorKyc.InvalidWebhookSecret,
        HttpStatus.BAD_REQUEST,
      );
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
      throw new ControlledError(
        ErrorKyc.InvalidSynapsAPIResponse,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const kycEntity = await this.kycRepository.findOneBySessionId(
      data.sessionId,
    );
    if (!kycEntity) {
      throw new ControlledError(ErrorKyc.NotFound, HttpStatus.BAD_REQUEST);
    }
    kycEntity.status = data.state;
    kycEntity.message = data.reason;

    await this.kycRepository.updateOne(kycEntity);
  }
}
