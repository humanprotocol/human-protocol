import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

import { KycConfigService, Web3ConfigService } from '@/config';
import logger from '@/logger';
import { UserNotFoundError, UserRepository } from '@/modules/user';
import { Web3Service } from '@/modules/web3';
import * as httpUtils from '@/utils/http';

import { KycStatus } from './constants';
import { KycSignedAddressDto, UpdateKycStatusDto } from './kyc.dto';
import { KycEntity } from './kyc.entity';
import { KycErrorMessage, KycError } from './kyc.error';
import { KycRepository } from './kyc.repository';
import type { VeriffCreateSessionResponse } from './types';

@Injectable()
export class KycService {
  private readonly logger = logger.child({ context: KycService.name });

  constructor(
    private readonly kycRepository: KycRepository,
    private readonly httpService: HttpService,
    private readonly kycConfigService: KycConfigService,
    private readonly userRepository: UserRepository,
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  async initSession(userId: number): Promise<{ url: string }> {
    const existingKycEntity = await this.kycRepository.findOneByUserId(userId);

    if (existingKycEntity) {
      if (existingKycEntity.status === KycStatus.APPROVED) {
        throw new KycError(KycErrorMessage.ALREADY_APPROVED, userId);
      }

      if (existingKycEntity.status === KycStatus.REVIEW) {
        throw new KycError(KycErrorMessage.VERIFICATION_IN_PROGRESS, userId);
      }

      if (existingKycEntity.status === KycStatus.DECLINED) {
        throw new KycError(KycErrorMessage.DECLINED, userId);
      }

      return {
        url: existingKycEntity.url,
      };
    }

    const body = {
      verification: {
        vendorData: `${userId}`,
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
            const formattedError = httpUtils.formatAxiosError(error);
            const errorMessage =
              'Error occurred while initializing KYC session';
            this.logger.error(errorMessage, {
              error: formattedError,
              userId,
            });
            throw new Error(errorMessage);
          }),
        ),
    );

    if (data?.status !== 'success' || !data?.verification?.url) {
      throw new KycError(
        KycErrorMessage.INVALID_KYC_PROVIDER_API_RESPONSE,
        userId,
      );
    }

    const kycEntity = new KycEntity();
    kycEntity.sessionId = data.verification.id;
    kycEntity.status = KycStatus.NONE;
    kycEntity.userId = userId;
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

  async getSignedAddress(userId: number): Promise<KycSignedAddressDto> {
    const user = await this.userRepository.findOneById(userId, {
      relations: { kyc: true },
    });
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    if (!user.evmAddress) {
      throw new KycError(KycErrorMessage.NO_WALLET_ADDRESS_REGISTERED, userId);
    }

    if (user.kyc?.status !== KycStatus.APPROVED) {
      throw new KycError(KycErrorMessage.KYC_NOT_APPROVED, userId);
    }

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
