import { HttpStatus, Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';

import { UserEntity } from '../user/user.entity';
import { HttpService } from '@nestjs/axios';
import { KycSessionDto, KycSignedAddressDto, KycStatusDto } from './kyc.dto';
import { KycRepository } from './kyc.repository';
import { KycServiceType, KycStatus } from '../../common/enums/user';
import { firstValueFrom } from 'rxjs';
import { ErrorKyc, ErrorUser } from '../../common/constants/errors';
import { SynapsConfigService } from '../../common/config/synaps-config.service';
import { SYNAPS_API_KEY_DISABLED } from '../../common/constants';
import { v4 as uuidv4 } from 'uuid';
import { KycEntity } from './kyc.entity';
import { ControlledError } from '../../common/errors/controlled';
import { countriesA3ToA2 } from '../../common/enums/countries';
import { Web3Service } from '../web3/web3.service';
import { NetworkConfigService } from '../../common/config/network-config.service';

@Injectable()
export class KycService {
  constructor(
    private kycRepository: KycRepository,
    private readonly httpService: HttpService,
    private readonly synapsConfigService: SynapsConfigService,
    private readonly web3Service: Web3Service,
    private readonly networkConfigService: NetworkConfigService,
  ) {}

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
          baseURL: this.synapsConfigService.baseUrl,
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
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { data: sessionData } = await firstValueFrom(
      await this.httpService.get(`/individual/session/${data.sessionId}`, {
        baseURL: this.synapsConfigService.baseUrl,
        headers: {
          'Api-Key': this.synapsConfigService.apiKey,
        },
      }),
    );

    if (
      !sessionData?.session?.status ||
      sessionData.session.status !== data.status
    ) {
      throw new ControlledError(
        ErrorKyc.InvalidSynapsAPIResponse,
        HttpStatus.BAD_REQUEST,
      );
    }

    const kycEntity = await this.kycRepository.findOneBySessionId(
      data.sessionId,
    );
    if (!kycEntity) {
      throw new ControlledError(ErrorKyc.NotFound, HttpStatus.BAD_REQUEST);
    }

    if (data.status === KycStatus.APPROVED) {
      const sessionInfo = await firstValueFrom(
        this.httpService
          .get(
            `/individual/session/${data.sessionId}/step/${this.synapsConfigService.documentID}`,
            {
              baseURL: this.synapsConfigService.baseUrl,
              headers: { 'Api-Key': this.synapsConfigService.apiKey },
            },
          )
          .pipe(map((response) => response.data)),
      );

      if (
        sessionInfo?.document?.country &&
        sessionInfo.document.country.trim() !== ''
      ) {
        kycEntity.country = countriesA3ToA2[sessionInfo.document.country];
      }
    }

    if (data.service == KycServiceType.ID_DOCUMENT) {
      if (data.status === KycStatus.APPROVED && !kycEntity.country) {
        kycEntity.status = KycStatus.ERROR;
        kycEntity.message = `${data.status} - ${ErrorKyc.CountryNotSet}`;
      } else {
        kycEntity.status = data.status;
        kycEntity.message = data.reason;
      }
    }

    await this.kycRepository.updateOne(kycEntity);
  }

  public async getSignedAddress(
    user: UserEntity,
  ): Promise<KycSignedAddressDto> {
    if (!user.evmAddress)
      throw new ControlledError(
        ErrorUser.NoWalletAddresRegistered,
        HttpStatus.BAD_REQUEST,
      );

    if (user.kyc?.status !== KycStatus.APPROVED)
      throw new ControlledError(
        ErrorUser.KycNotApproved,
        HttpStatus.BAD_REQUEST,
      );

    const address = user.evmAddress.toLowerCase();
    const signature = await this.web3Service
      .getSigner(this.networkConfigService.networks[0].chainId)
      .signMessage(address);

    return {
      key: `KYC-${this.web3Service.getOperatorAddress()}`,
      value: signature,
    };
  }
}
