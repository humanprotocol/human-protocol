import { HttpStatus, Injectable } from '@nestjs/common';

import { UserEntity } from '../user/user.entity';
import { HttpService } from '@nestjs/axios';
import { KycSessionDto, KycSignedAddressDto, KycStatusDto } from './kyc.dto';
import { KycRepository } from './kyc.repository';
import { KycStatus } from '../../common/enums/user';
import { firstValueFrom } from 'rxjs';
import { ErrorKyc, ErrorUser } from '../../common/constants/errors';
import { KycConfigService } from '../../common/config/kyc-config.service';
import { KycEntity } from './kyc.entity';
import { ControlledError } from '../../common/errors/controlled';
import { Web3Service } from '../web3/web3.service';
import { NetworkConfigService } from '../../common/config/network-config.service';

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
        throw new ControlledError(
          ErrorKyc.AlreadyApproved,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (userEntity.kyc.status === KycStatus.REVIEW) {
        throw new ControlledError(
          ErrorKyc.VerificationInProgress,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (userEntity.kyc.status === KycStatus.DECLINED) {
        throw new ControlledError(
          `${ErrorKyc.Declined}. Reason: ${userEntity.kyc.message}`,
          HttpStatus.BAD_REQUEST,
        );
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
      throw new ControlledError(
        ErrorKyc.InvalidKycProviderAPIResponse,
        HttpStatus.INTERNAL_SERVER_ERROR,
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
    const { status, id: sessionId } = data.verification;
    const { country } = data.verification.document;

    const kycEntity = await this.kycRepository.findOneBySessionId(sessionId);
    if (!kycEntity) {
      throw new ControlledError(ErrorKyc.NotFound, HttpStatus.BAD_REQUEST);
    }

    if (!country) {
      throw new ControlledError(ErrorKyc.CountryNotSet, HttpStatus.BAD_REQUEST);
    }

    if (status === KycStatus.APPROVED) {
      kycEntity.status = status;
      kycEntity.country = country;
    } else {
      kycEntity.status = data.verification.status;
      kycEntity.message = data.verification.reason;
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
