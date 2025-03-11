import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  StartSessionResponseDto,
  KycSignedAddressDto,
  UpdateKycStatusDto,
} from './kyc.dto';
import { KycRepository } from './kyc.repository';
import { KycStatus } from './constants';
import { catchError, firstValueFrom } from 'rxjs';
import { KycConfigService } from '../../config/kyc-config.service';
import { Web3ConfigService } from '../..//config/web3-config.service';
import { KycEntity } from './kyc.entity';
import { Web3Service } from '../web3/web3.service';
import { UserEntity } from '../user';

import { KycErrorMessage, KycError } from './kyc.error';

import logger from '../../logger';
import { AxiosError } from 'axios';
import { formatAxiosError } from '../../utils/format-axios-error';

@Injectable()
export class KycService {
  private readonly logger = logger.child({ context: KycService.name });

  constructor(
    private kycRepository: KycRepository,
    private readonly httpService: HttpService,
    private readonly kycConfigService: KycConfigService,
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  public async initSession(
    userEntity: UserEntity,
  ): Promise<StartSessionResponseDto> {
    if (userEntity.kyc?.sessionId) {
      if (userEntity.kyc.status === KycStatus.APPROVED) {
        throw new KycError(KycErrorMessage.ALREADY_APPROVED, userEntity.id);
      }

      if (userEntity.kyc.status === KycStatus.REVIEW) {
        throw new KycError(
          KycErrorMessage.VERIFICATION_IN_PROGRESS,
          userEntity.id,
        );
      }

      if (userEntity.kyc.status === KycStatus.DECLINED) {
        throw new KycError(KycErrorMessage.DECLINED, userEntity.id);
      }

      return {
        url: userEntity.kyc.url,
      };
    }

    const body = {
      verification: {
        vendorData: `${userEntity.id}`,
      },
    };

    const { data } = await firstValueFrom(
      this.httpService
        .post('sessions', body, {
          baseURL: this.kycConfigService.baseUrl,
          headers: {
            'X-AUTH-CLIENT': this.kycConfigService.apiKey,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            const formattedError = formatAxiosError(error);
            this.logger.error(
              'Error occurred during initializing KYC session',
              {
                error: formattedError,
                userId: userEntity.id,
              },
            );
            throw new Error('Error occurred during initializing KYC session');
          }),
        ),
    );

    if (data?.status !== 'success' || !data?.verification?.url) {
      throw new KycError(
        KycErrorMessage.INVALID_KYC_PROVIDER_API_RESPONSE,
        userEntity.id,
      );
    }

    const kycEntity = new KycEntity();
    kycEntity.sessionId = data.verification.id;
    kycEntity.status = KycStatus.NONE;
    kycEntity.userId = userEntity.id;
    kycEntity.url = data.verification.url;

    await this.kycRepository.createUnique(kycEntity);

    return {
      url: data.verification.url,
    };
  }

  public async updateKycStatus(data: UpdateKycStatusDto): Promise<void> {
    const { status, reason, id: sessionId } = data.verification;
    const { country } = data.verification.document;

    const kycEntity = await this.kycRepository.findOneBySessionId(sessionId);
    if (!kycEntity) {
      // vendorData is a userId
      throw new KycError(
        KycErrorMessage.NOT_FOUND,
        Number(data.verification.vendorData),
      );
    }

    // Since veriff doesn't guarantee a webhook delivery order we need to make sure that we update only kycs in intermediate status
    if (
      kycEntity.status !== KycStatus.RESUBMISSION_REQUESTED &&
      kycEntity.status !== KycStatus.NONE
    ) {
      return;
    }
    if (status === KycStatus.APPROVED) {
      if (!country) {
        throw new KycError(KycErrorMessage.COUNTRY_NOT_SET, kycEntity.userId);
      }
      kycEntity.country = country;
    }

    kycEntity.status = status;
    kycEntity.message = reason;

    await this.kycRepository.updateOne(kycEntity);
  }

  public async getSignedAddress(
    user: UserEntity,
  ): Promise<KycSignedAddressDto> {
    if (!user.evmAddress)
      throw new KycError(KycErrorMessage.NO_WALLET_ADDRESS_REGISTERED, user.id);

    if (user.kyc?.status !== KycStatus.APPROVED)
      throw new KycError(KycErrorMessage.KYC_NOT_APPROVED, user.id);

    const address = user.evmAddress.toLowerCase();
    const signature = await this.web3Service
      .getSigner(this.web3ConfigService.reputationNetworkChainId)
      .signMessage(address);

    return {
      key: `KYC-${this.web3ConfigService.operatorAddress}`,
      value: signature,
    };
  }
}
