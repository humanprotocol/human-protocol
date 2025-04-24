import { KVStoreClient, KVStoreUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';

import { SignatureType } from '../../common/enums';
import { Web3ConfigService } from '../../config/web3-config.service';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import * as web3Utils from '../../utils/web3';

import { KycStatus } from '../kyc/constants';
import { Web3Service } from '../web3/web3.service';

import { SiteKeyEntity, SiteKeyType } from './site-key.entity';
import { SiteKeyRepository } from './site-key.repository';
import { OperatorUserEntity, Web2UserEntity } from './types';
import { Role as UserRole, UserEntity } from './user.entity';
import {
  UserError,
  UserErrorMessage,
  DuplicatedWalletAddressError,
  InvalidWeb3SignatureError,
} from './user.error';
import { UserRepository } from './user.repository';

export enum OperatorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly siteKeyRepository: SiteKeyRepository,
    private readonly web3Service: Web3Service,
    private readonly hcaptchaService: HCaptchaService,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  static isWeb2UserRole(userRole: string): boolean {
    return [UserRole.ADMIN, UserRole.HUMAN_APP, UserRole.WORKER].includes(
      userRole as UserRole,
    );
  }

  async findWeb2UserByEmail(email: string): Promise<Web2UserEntity | null> {
    const userEntity = await this.userRepository.findOneByEmail(email, {
      relations: {
        kyc: true,
        userQualifications: {
          qualification: true,
        },
      },
    });

    if (userEntity && UserService.isWeb2UserRole(userEntity.role)) {
      return userEntity as Web2UserEntity;
    }

    return null;
  }

  async findOperatorUser(address: string): Promise<OperatorUserEntity | null> {
    const userEntity = await this.userRepository.findOneByAddress(address);

    if (userEntity && userEntity.role === UserRole.OPERATOR) {
      return userEntity as OperatorUserEntity;
    }

    return null;
  }

  async registerLabeler(user: Web2UserEntity): Promise<string> {
    if (user.role !== UserRole.WORKER) {
      throw new UserError(UserErrorMessage.INVALID_ROLE, user.id);
    }

    if (!user.evmAddress) {
      throw new UserError(UserErrorMessage.MISSING_ADDRESS, user.id);
    }

    if (user.kyc?.status !== KycStatus.APPROVED) {
      throw new UserError(UserErrorMessage.KYC_NOT_APPROVED, user.id);
    }

    // TODO: load sitekeys from repository instead of user entity in request
    if (user.siteKeys && user.siteKeys.length > 0) {
      const existingHcaptchaSiteKey = user.siteKeys?.find(
        (key) => key.type === SiteKeyType.HCAPTCHA,
      );
      if (existingHcaptchaSiteKey) {
        return existingHcaptchaSiteKey.siteKey;
      }
    }

    // Register user as a labeler at hcaptcha foundation
    const registeredLabeler = await this.hcaptchaService.registerLabeler({
      email: user.email,
      evmAddress: user.evmAddress,
      country: user.kyc.country as string,
    });

    if (!registeredLabeler) {
      throw new UserError(UserErrorMessage.LABELING_ENABLE_FAILED, user.id);
    }

    // Retrieve labeler sitekeys from hCaptcha foundation
    const labelerData = await this.hcaptchaService.getLabelerData(user.email);
    if (!labelerData?.sitekeys.length) {
      throw new UserError(UserErrorMessage.LABELING_ENABLE_FAILED, user.id);
    }

    const siteKey = labelerData.sitekeys[0].sitekey;

    const newSiteKey = new SiteKeyEntity();
    newSiteKey.siteKey = siteKey;
    newSiteKey.userId = user.id;
    newSiteKey.type = SiteKeyType.HCAPTCHA;

    await this.siteKeyRepository.createUnique(newSiteKey);

    return siteKey;
  }

  async registerAddress(
    user: UserEntity,
    address: string,
    signature: string,
  ): Promise<void> {
    const lowercasedAddress = address.toLocaleLowerCase();

    if (user.evmAddress) {
      throw new UserError(UserErrorMessage.ADDRESS_EXISTS, user.id);
    }

    if (user.kyc?.status !== KycStatus.APPROVED) {
      throw new UserError(UserErrorMessage.KYC_NOT_APPROVED, user.id);
    }

    const userWithSameAddress =
      await this.userRepository.findOneByAddress(lowercasedAddress);

    if (userWithSameAddress) {
      throw new DuplicatedWalletAddressError(user.id, address);
    }

    // Prepare signed data and verify the signature
    const signedData = web3Utils.prepareSignatureBody({
      from: address,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.REGISTER_ADDRESS,
    });
    const verified = web3Utils.verifySignature(signedData, signature, [
      lowercasedAddress,
    ]);

    if (!verified) {
      throw new InvalidWeb3SignatureError(user.id, address);
    }

    user.evmAddress = lowercasedAddress;
    await this.userRepository.updateOne(user);
  }

  async enableOperator(
    user: OperatorUserEntity,
    signature: string,
  ): Promise<void> {
    const signedData = web3Utils.prepareSignatureBody({
      from: user.evmAddress,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.ENABLE_OPERATOR,
    });

    const verified = web3Utils.verifySignature(signedData, signature, [
      user.evmAddress,
    ]);

    if (!verified) {
      throw new InvalidWeb3SignatureError(user.id, user.evmAddress);
    }

    const chainId = this.web3ConfigService.reputationNetworkChainId;
    const signer = this.web3Service.getSigner(chainId);
    const kvstore = await KVStoreClient.build(signer);

    let status: string | undefined;
    try {
      status = await KVStoreUtils.get(chainId, signer.address, user.evmAddress);
    } catch {}

    if (status === OperatorStatus.ACTIVE) {
      throw new UserError(UserErrorMessage.OPERATOR_ALREADY_ACTIVE, user.id);
    }

    await kvstore.set(user.evmAddress, OperatorStatus.ACTIVE);
  }

  async disableOperator(
    user: OperatorUserEntity,
    signature: string,
  ): Promise<void> {
    const signedData = web3Utils.prepareSignatureBody({
      from: user.evmAddress,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.DISABLE_OPERATOR,
    });

    const verified = web3Utils.verifySignature(signedData, signature, [
      user.evmAddress,
    ]);

    if (!verified) {
      throw new InvalidWeb3SignatureError(user.id, user.evmAddress);
    }

    const chainId = this.web3ConfigService.reputationNetworkChainId;
    const signer = this.web3Service.getSigner(chainId);
    const kvstore = await KVStoreClient.build(signer);

    const status = await KVStoreUtils.get(
      chainId,
      signer.address,
      user.evmAddress,
    );

    if (status === OperatorStatus.INACTIVE) {
      throw new UserError(UserErrorMessage.OPERATOR_NOT_ACTIVE, user.id);
    }

    await kvstore.set(user.evmAddress, OperatorStatus.INACTIVE);
  }

  async registrationInExchangeOracle(
    user: Web2UserEntity,
    oracleAddress: string,
  ): Promise<void> {
    const siteKey = await this.siteKeyRepository.findByUserSiteKeyAndType(
      user.id,
      oracleAddress,
      SiteKeyType.REGISTRATION,
    );
    if (siteKey) {
      return;
    }

    const newSiteKey = new SiteKeyEntity();
    newSiteKey.siteKey = oracleAddress;
    newSiteKey.type = SiteKeyType.REGISTRATION;
    newSiteKey.userId = user.id;

    await this.siteKeyRepository.createUnique(newSiteKey);
  }

  async getRegistrationInExchangeOracles(user: UserEntity): Promise<string[]> {
    const siteKeys = await this.siteKeyRepository.findByUserAndType(
      user.id,
      SiteKeyType.REGISTRATION,
    );
    return siteKeys.map((siteKey) => siteKey.siteKey);
  }
}
