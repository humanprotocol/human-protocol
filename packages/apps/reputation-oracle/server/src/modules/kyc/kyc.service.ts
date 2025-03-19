import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

import { KycConfigService } from '../../config/kyc-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';
import logger from '../../logger';
import { UserEntity } from '../user';
import { formatAxiosError } from '../../utils/format-axios-error';
import { Web3Service } from '../web3/web3.service';
import { KycStatus } from './constants';
import { KycSignedAddressDto, UpdateKycStatusDto } from './kyc.dto';
import { KycEntity } from './kyc.entity';
import { KycErrorMessage, KycError } from './kyc.error';
import { KycRepository } from './kyc.repository';

type VeriffCreateSessionResponse = {
  status: string;
  verification: {
    id: string;
    url: string;
  };
};

@Injectable()
export class KycService {
  private readonly logger = logger.child({ context: KycService.name });

  constructor(
    private readonly kycRepository: KycRepository,
    private readonly httpService: HttpService,
    private readonly kycConfigService: KycConfigService,
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  async initSession(userEntity: UserEntity): Promise<{ url: string }> {
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
        .post<VeriffCreateSessionResponse>(
          `${this.kycConfigService.baseUrl}/sessions`,
          body,
          {
            headers: {
              'X-AUTH-CLIENT': this.kycConfigService.apiKey,
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            const formattedError = formatAxiosError(error);
            const errorMessage =
              'Error occurred while initializing KYC session';
            this.logger.error(errorMessage, {
              error: formattedError,
              userId: userEntity.id,
            });
            throw new Error(errorMessage);
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

  async updateKycStatus(data: UpdateKycStatusDto): Promise<void> {
    if (data.status !== 'success') {
      this.logger.warn('Unexpected veriff webhook status', {
        status: data.status,
      });
      return;
    }

    const { status, reason, id: sessionId } = data.verification;
    const { country } = data.verification.document;

    const kycEntity = await this.kycRepository.findOneBySessionId(sessionId);
    if (!kycEntity) {
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

  async getSignedAddress(user: UserEntity): Promise<KycSignedAddressDto> {
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
