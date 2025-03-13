import { KVStoreClient, KVStoreUtils } from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Web3ConfigService } from '../../config/web3-config.service';
import { OperatorStatus } from '../../common/enums/user';
import { KycStatus } from '../kyc/constants';
import { SignatureType } from '../../common/enums/web3';
import { SiteKeyType } from '../../common/enums';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import {
  generateNonce,
  verifySignature,
  prepareSignatureBody,
} from '../../utils/web3';
import { Web3Service } from '../web3/web3.service';
import { SiteKeyEntity } from './site-key.entity';
import { SiteKeyRepository } from './site-key.repository';
import { RegisterAddressRequestDto } from './user.dto';
import { Role, UserStatus, UserEntity } from './user.entity';
import {
  UserError,
  UserErrorMessage,
  DuplicatedWalletAddressError,
  InvalidWeb3SignatureError,
} from './user.error';
import { UserRepository } from './user.repository';
import { OperatorUserEntity, Web2UserEntity } from './types';
import { UserRole } from '.';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly siteKeyRepository: SiteKeyRepository,
    private readonly web3Service: Web3Service,
    private readonly hcaptchaService: HCaptchaService,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  static checkPasswordMatchesHash(
    password: string,
    passwordHash: string,
  ): boolean {
    return bcrypt.compareSync(password, passwordHash);
  }

  static isWeb2UserRole(userRole: string): boolean {
    return [UserRole.ADMIN, UserRole.HUMAN_APP, UserRole.WORKER].includes(
      userRole as UserRole,
    );
  }

  private hashPassword(password: string): string {
    const SALT_GENERATION_ROUNDS = 12;
    return bcrypt.hashSync(password, SALT_GENERATION_ROUNDS);
  }

  async createWorkerUser(data: {
    email: string;
    password: string;
  }): Promise<Web2UserEntity> {
    const newUser = new UserEntity();
    newUser.email = data.email;
    newUser.password = this.hashPassword(data.password);
    newUser.role = Role.WORKER;
    newUser.status = UserStatus.PENDING;

    await this.userRepository.createUnique(newUser);

    return newUser as Web2UserEntity;
  }

  async findWeb2UserByEmail(email: string): Promise<Web2UserEntity | null> {
    const userEntity = await this.userRepository.findOneByEmail(email, {
      relations: {
        kyc: true,
        siteKeys: true,
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

  async updatePassword(
    userId: number,
    newPassword: string,
  ): Promise<Web2UserEntity> {
    const userEntity = await this.userRepository.findOneById(userId);

    if (!userEntity) {
      throw new Error('User not found');
    }

    if (!UserService.isWeb2UserRole(userEntity.role)) {
      throw new Error('Only web2 users can have password');
    }

    userEntity.password = this.hashPassword(newPassword);

    await this.userRepository.updateOne(userEntity);

    return userEntity as Web2UserEntity;
  }

  async createOperatorUser(address: string): Promise<OperatorUserEntity> {
    const newUser = new UserEntity();
    newUser.evmAddress = address.toLowerCase();
    newUser.nonce = generateNonce();
    newUser.role = Role.OPERATOR;
    newUser.status = UserStatus.ACTIVE;

    await this.userRepository.createUnique(newUser);

    return newUser as OperatorUserEntity;
  }

  async findOperatorUser(address: string): Promise<OperatorUserEntity | null> {
    const userEntity = await this.userRepository.findOneByAddress(address);

    if (userEntity && userEntity.role === UserRole.OPERATOR) {
      return userEntity as OperatorUserEntity;
    }

    return null;
  }

  async makeUserActive(userId: number): Promise<void> {
    const userEntity = await this.userRepository.findOneById(userId);
    if (!userEntity) {
      throw new Error('User not found');
    }

    userEntity.status = UserStatus.ACTIVE;

    await this.userRepository.updateOne(userEntity);
  }

  async updateNonce(userEntity: OperatorUserEntity): Promise<UserEntity> {
    userEntity.nonce = generateNonce();
    return this.userRepository.updateOne(userEntity);
  }

  async registerLabeler(user: Web2UserEntity): Promise<string> {
    if (user.role !== Role.WORKER) {
      throw new UserError(UserErrorMessage.INVALID_ROLE, user.id);
    }

    if (!user.evmAddress) {
      throw new UserError(UserErrorMessage.MISSING_ADDRESS, user.id);
    }

    if (user.kyc?.status !== KycStatus.APPROVED) {
      throw new UserError(UserErrorMessage.KYC_NOT_APPROVED, user.id);
    }

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
    data: RegisterAddressRequestDto,
  ): Promise<void> {
    const lowercasedAddress = data.address.toLocaleLowerCase();

    if (user.evmAddress) {
      throw new UserError(UserErrorMessage.ADDRESS_EXISTS, user.id);
    }

    if (user.kyc?.status !== KycStatus.APPROVED) {
      throw new UserError(UserErrorMessage.KYC_NOT_APPROVED, user.id);
    }

    const dbUser =
      await this.userRepository.findOneByAddress(lowercasedAddress);
    if (dbUser) {
      throw new DuplicatedWalletAddressError(user.id, lowercasedAddress);
    }

    // Prepare signed data and verify the signature
    const signedData = prepareSignatureBody({
      from: lowercasedAddress,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.REGISTER_ADDRESS,
    });
    const verified = verifySignature(signedData, data.signature, [
      lowercasedAddress,
    ]);

    if (!verified) {
      throw new InvalidWeb3SignatureError(user.id, lowercasedAddress);
    }

    user.evmAddress = lowercasedAddress;
    await this.userRepository.updateOne(user);
  }

  async enableOperator(
    user: OperatorUserEntity,
    signature: string,
  ): Promise<void> {
    const signedData = prepareSignatureBody({
      from: user.evmAddress,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.ENABLE_OPERATOR,
    });

    const verified = verifySignature(signedData, signature, [user.evmAddress]);

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

    await kvstore.set(user.evmAddress.toLowerCase(), OperatorStatus.ACTIVE);
  }

  async disableOperator(
    user: OperatorUserEntity,
    signature: string,
  ): Promise<void> {
    const signedData = prepareSignatureBody({
      from: user.evmAddress,
      to: this.web3ConfigService.operatorAddress,
      contents: SignatureType.DISABLE_OPERATOR,
    });

    const verified = verifySignature(signedData, signature, [user.evmAddress]);

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

    await kvstore.set(user.evmAddress.toLowerCase(), OperatorStatus.INACTIVE);
  }

  async registrationInExchangeOracle(
    user: Web2UserEntity,
    oracleAddress: string,
  ): Promise<SiteKeyEntity> {
    const siteKey = await this.siteKeyRepository.findByUserSiteKeyAndType(
      user.id,
      oracleAddress,
      SiteKeyType.REGISTRATION,
    );
    if (siteKey) return siteKey;

    const newSiteKey = new SiteKeyEntity();
    newSiteKey.siteKey = oracleAddress;
    newSiteKey.type = SiteKeyType.REGISTRATION;
    newSiteKey.userId = user.id;

    return await this.siteKeyRepository.createUnique(newSiteKey);
  }

  public async getRegistrationInExchangeOracles(
    user: UserEntity,
  ): Promise<string[]> {
    const siteKeys = await this.siteKeyRepository.findByUserAndType(
      user.id,
      SiteKeyType.REGISTRATION,
    );
    return siteKeys.map((siteKey) => siteKey.siteKey);
  }
}
