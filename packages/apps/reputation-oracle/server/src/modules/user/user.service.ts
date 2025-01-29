import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  KycStatus,
  OperatorStatus,
  UserStatus,
  Role,
} from '../../common/enums/user';
import { generateNonce, verifySignature } from '../../common/utils/signature';
import { UserEntity } from './user.entity';
import { RegisterAddressRequestDto, UserCreateDto } from './user.dto';
import { UserRepository } from './user.repository';
import { ValidatePasswordDto } from '../auth/auth.dto';
import { Web3Service } from '../web3/web3.service';
import { SignatureType, Web3Env } from '../../common/enums/web3';
import { ChainId, KVStoreClient, KVStoreUtils } from '@human-protocol/sdk';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { SiteKeyEntity } from './site-key.entity';
import { SiteKeyRepository } from './site-key.repository';
import { SiteKeyType } from '../../common/enums';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import { HCaptchaConfigService } from '../../common/config/hcaptcha-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { prepareSignatureBody } from '../../common/utils/signature';
import { KycSignedAddressDto } from '../kyc/kyc.dto';
import { ethers } from 'ethers';
import {
  UserError,
  UserErrorMessage,
  DuplicatedWalletAddressError,
  InvalidWeb3SignatureError,
} from './user.error';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private HASH_ROUNDS = 12;
  constructor(
    private userRepository: UserRepository,
    private siteKeyRepository: SiteKeyRepository,
    private readonly web3Service: Web3Service,
    private readonly hcaptchaService: HCaptchaService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly hcaptchaConfigService: HCaptchaConfigService,
    private readonly networkConfigService: NetworkConfigService,
  ) {}

  static checkPasswordMatchesHash(
    password: string,
    passwordHash: string,
  ): boolean {
    return bcrypt.compareSync(password, passwordHash);
  }

  public async create(dto: UserCreateDto): Promise<UserEntity> {
    const newUser = new UserEntity();
    newUser.email = dto.email;
    newUser.password = bcrypt.hashSync(dto.password, this.HASH_ROUNDS);
    newUser.role = Role.WORKER;
    newUser.status = UserStatus.PENDING;
    await this.userRepository.createUnique(newUser);
    return newUser;
  }

  public updatePassword(
    userEntity: UserEntity,
    data: ValidatePasswordDto,
  ): Promise<UserEntity> {
    userEntity.password = bcrypt.hashSync(data.password, this.HASH_ROUNDS);
    return this.userRepository.updateOne(userEntity);
  }

  public activate(userEntity: UserEntity): Promise<UserEntity> {
    userEntity.status = UserStatus.ACTIVE;
    return this.userRepository.updateOne(userEntity);
  }

  public async createWeb3User(address: string): Promise<UserEntity> {
    const newUser = new UserEntity();
    newUser.evmAddress = address.toLowerCase();
    newUser.nonce = generateNonce();
    newUser.role = Role.OPERATOR;
    newUser.status = UserStatus.ACTIVE;

    await this.userRepository.createUnique(newUser);
    return newUser;
  }

  public async updateNonce(userEntity: UserEntity): Promise<UserEntity> {
    userEntity.nonce = generateNonce();
    return this.userRepository.updateOne(userEntity);
  }

  public async registerLabeler(user: UserEntity): Promise<string> {
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
      language: this.hcaptchaConfigService.defaultLabelerLang,
      country: user.kyc.country,
      address: ethers.getAddress(user.evmAddress),
    });

    if (!registeredLabeler) {
      throw new UserError(UserErrorMessage.LABELING_ENABLE_FAILED, user.id);
    }

    // Retrieve labeler site key from hcaptcha foundation
    const labelerData = await this.hcaptchaService.getLabelerData({
      email: user.email,
    });
    if (!labelerData || !labelerData.sitekeys.length) {
      throw new UserError(UserErrorMessage.LABELING_ENABLE_FAILED, user.id);
    }
    const siteKey = labelerData.sitekeys[0].sitekey;

    const newSiteKey = new SiteKeyEntity();
    newSiteKey.siteKey = siteKey;
    newSiteKey.user = user;
    newSiteKey.type = SiteKeyType.HCAPTCHA;

    await this.siteKeyRepository.createUnique(newSiteKey);

    return siteKey;
  }

  public async registerAddress(
    user: UserEntity,
    data: RegisterAddressRequestDto,
  ): Promise<KycSignedAddressDto> {
    data.address = data.address.toLowerCase();

    if (user.evmAddress) {
      throw new UserError(UserErrorMessage.ADDRESS_EXISTS, user.id);
    }

    if (user.kyc?.status !== KycStatus.APPROVED) {
      throw new UserError(UserErrorMessage.KYC_NOT_APPROVED, user.id);
    }

    const dbUser = await this.userRepository.findOneByAddress(data.address);
    if (dbUser) {
      throw new DuplicatedWalletAddressError(user.id, data.address);
    }

    // Prepare signed data and verify the signature
    const signedData = prepareSignatureBody({
      from: data.address,
      to: this.web3Service.getOperatorAddress(),
      contents: SignatureType.REGISTER_ADDRESS,
    });
    const verified = verifySignature(signedData, data.signature, [
      data.address,
    ]);

    if (!verified) {
      throw new InvalidWeb3SignatureError(user.id, data.address);
    }

    user.evmAddress = data.address.toLowerCase();
    await this.userRepository.updateOne(user);

    const signature = await this.web3Service
      .getSigner(this.networkConfigService.networks[0].chainId)
      .signMessage(data.address);

    return {
      key: `KYC-${this.web3Service.getOperatorAddress()}`,
      value: signature,
    };
  }

  public async enableOperator(
    user: UserEntity,
    signature: string,
  ): Promise<void> {
    const signedData = prepareSignatureBody({
      from: user.evmAddress,
      to: this.web3Service.getOperatorAddress(),
      contents: SignatureType.ENABLE_OPERATOR,
    });

    const verified = verifySignature(signedData, signature, [user.evmAddress]);

    if (!verified) {
      throw new InvalidWeb3SignatureError(user.id, user.evmAddress);
    }

    let chainId: ChainId;
    const currentWeb3Env = this.web3ConfigService.env;
    if (currentWeb3Env === Web3Env.MAINNET) {
      chainId = ChainId.POLYGON;
    } else if (currentWeb3Env === Web3Env.LOCALHOST) {
      chainId = ChainId.LOCALHOST;
    } else {
      chainId = ChainId.POLYGON_AMOY;
    }

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

  public async disableOperator(
    user: UserEntity,
    signature: string,
  ): Promise<void> {
    const signedData = prepareSignatureBody({
      from: user.evmAddress,
      to: this.web3Service.getOperatorAddress(),
      contents: SignatureType.DISABLE_OPERATOR,
    });

    const verified = verifySignature(signedData, signature, [user.evmAddress]);

    if (!verified) {
      throw new InvalidWeb3SignatureError(user.id, user.evmAddress);
    }

    let chainId: ChainId;
    const currentWeb3Env = this.web3ConfigService.env;
    if (currentWeb3Env === Web3Env.MAINNET) {
      chainId = ChainId.POLYGON;
    } else if (currentWeb3Env === Web3Env.LOCALHOST) {
      chainId = ChainId.LOCALHOST;
    } else {
      chainId = ChainId.POLYGON_AMOY;
    }

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

  public async registrationInExchangeOracle(
    user: UserEntity,
    oracleAddress: string,
  ): Promise<SiteKeyEntity> {
    const siteKey = await this.siteKeyRepository.findByUserSiteKeyAndType(
      user,
      oracleAddress,
      SiteKeyType.REGISTRATION,
    );
    if (siteKey) return siteKey;

    const newSiteKey = new SiteKeyEntity();
    newSiteKey.siteKey = oracleAddress;
    newSiteKey.type = SiteKeyType.REGISTRATION;
    newSiteKey.user = user;

    return await this.siteKeyRepository.createUnique(newSiteKey);
  }

  public async getRegistrationInExchangeOracles(
    user: UserEntity,
  ): Promise<string[]> {
    const siteKeys = await this.siteKeyRepository.findByUserAndType(
      user,
      SiteKeyType.REGISTRATION,
    );
    return siteKeys.map((siteKey) => siteKey.siteKey);
  }
}
