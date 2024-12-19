import { Injectable } from '@nestjs/common';

import { UserEntity } from '../user/user.entity';
import { HttpService } from '@nestjs/axios';
import { KycSessionDto, KycSignedAddressDto, KycStatusDto } from './kyc.dto';
import { KycRepository } from './kyc.repository';
import { KycStatus } from '../../common/enums/user';
import { firstValueFrom } from 'rxjs';
import { KycConfigService } from '../../common/config/kyc-config.service';
import { KycEntity } from './kyc.entity';
import { Web3Service } from '../web3/web3.service';
import { NetworkConfigService } from '../../common/config/network-config.service';

import { KycErrorMessage, KycError } from './kyc.error';

@Injectable()
export class KycService {
  constructor(
    private kycRepository: KycRepository,
    private readonly httpService: HttpService,
    private readonly kycConfigService: KycConfigService,
    private readonly web3Service: Web3Service,
    private readonly networkConfigService: NetworkConfigService,
  ) {}

  public async initSession(userEntity: UserEntity): Promise<KycSessionDto> {
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

    const { data } = await firstValueFrom(
      await this.httpService.post(
        'sessions',
        {
          verification: {
            vendorData: `${userEntity.id}`,
          },
        },
        {
          baseURL: this.kycConfigService.baseUrl,
          headers: {
            'X-AUTH-CLIENT': this.kycConfigService.apiKey,
          },
        },
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

  public async updateKycStatus(data: KycStatusDto): Promise<void> {
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

    if (!country) {
      throw new KycError(KycErrorMessage.COUNTRY_NOT_SET, kycEntity.userId);
    }

    kycEntity.status = status;
    kycEntity.country = country;
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
      .getSigner(this.networkConfigService.networks[0].chainId)
      .signMessage(address);

    return {
      key: `KYC-${this.web3Service.getOperatorAddress()}`,
      value: signature,
    };
  }
}
