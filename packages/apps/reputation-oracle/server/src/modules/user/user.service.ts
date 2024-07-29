import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ErrorOperator, ErrorUser } from '../../common/constants/errors';
import {
  KycStatus,
  OperatorStatus,
  UserStatus,
  Role,
} from '../../common/enums/user';
import { generateNonce, verifySignature } from '../../common/utils/signature';
import { UserEntity } from './user.entity';
import {
  RegisterAddressRequestDto,
  SignatureBodyDto,
  UserCreateDto,
} from './user.dto';
import { UserRepository } from './user.repository';
import { ValidatePasswordDto } from '../auth/auth.dto';
import { Web3Service } from '../web3/web3.service';
import { Wallet } from 'ethers';
import { SignatureType, Web3Env } from '../../common/enums/web3';
import { ChainId, KVStoreClient } from '@human-protocol/sdk';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { SiteKeyEntity } from './site-key.entity';
import { SiteKeyRepository } from './site-key.repository';
import { SiteKeyType } from '../../common/enums';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import { ControlledError } from '../../common/errors/controlled';
import { HCaptchaConfigService } from '../../common/config/hcaptcha-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { KycSignedAddressDto } from '../kyc/kyc.dto';

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

  public async create(dto: UserCreateDto): Promise<UserEntity> {
    const newUser = new UserEntity();
    newUser.email = dto.email;
    newUser.password = bcrypt.hashSync(dto.password, this.HASH_ROUNDS);
    newUser.role = Role.WORKER;
    newUser.status = UserStatus.PENDING;
    await this.userRepository.createUnique(newUser);
    return newUser;
  }

  public async getByCredentials(
    email: string,
    password: string,
  ): Promise<UserEntity | null> {
    const userEntity = await this.userRepository.findOneByEmail(email);

    if (!userEntity || !bcrypt.compareSync(password, userEntity.password)) {
      return null;
    }

    return userEntity;
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
    await this.checkEvmAddress(address);

    const newUser = new UserEntity();
    newUser.evmAddress = address.toLowerCase();
    newUser.nonce = generateNonce();
    newUser.role = Role.OPERATOR;
    newUser.status = UserStatus.ACTIVE;

    await this.userRepository.createUnique(newUser);
    return newUser;
  }

  public async checkEvmAddress(address: string): Promise<void> {
    const userEntity = await this.userRepository.findOneByAddress(address);

    if (userEntity) {
      this.logger.log(ErrorUser.AccountCannotBeRegistered, UserService.name);
      throw new ControlledError(
        ErrorUser.AccountCannotBeRegistered,
        HttpStatus.CONFLICT,
      );
    }
  }

  public async getByAddress(address: string): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOneByAddress(address);

    if (!userEntity) {
      throw new ControlledError(ErrorUser.NotFound, HttpStatus.NOT_FOUND);
    }

    return userEntity;
  }

  public async updateNonce(userEntity: UserEntity): Promise<UserEntity> {
    userEntity.nonce = generateNonce();
    return this.userRepository.updateOne(userEntity);
  }

  public async registerLabeler(user: UserEntity): Promise<string> {
    if (user.role !== Role.WORKER) {
      throw new BadRequestException(ErrorUser.InvalidType);
    }

    if (!user.evmAddress) {
      throw new ControlledError(
        ErrorUser.NoWalletAddresRegistered,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.kyc?.status !== KycStatus.APPROVED) {
      throw new BadRequestException(ErrorUser.KycNotApproved);
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
      address: user.evmAddress,
    });

    if (!registeredLabeler) {
      throw new ControlledError(
        ErrorUser.LabelingEnableFailed,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Retrieve labeler site key from hcaptcha foundation
    const labelerData = await this.hcaptchaService.getLabelerData({
      email: user.email,
    });
    if (!labelerData || !labelerData.sitekeys.length) {
      throw new ControlledError(
        ErrorUser.LabelingEnableFailed,
        HttpStatus.BAD_REQUEST,
      );
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
      throw new ControlledError(
        ErrorUser.AlreadyAssigned,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.kyc?.status !== KycStatus.APPROVED) {
      throw new ControlledError(
        ErrorUser.KycNotApproved,
        HttpStatus.BAD_REQUEST,
      );
    }

    const dbUser = await this.userRepository.findOneByAddress(data.address);
    if (dbUser) {
      throw new ControlledError(
        ErrorUser.DuplicatedAddress,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Prepare signed data and verify the signature
    const signedData = await this.prepareSignatureBody(
      SignatureType.REGISTER_ADDRESS,
      data.address,
    );
    verifySignature(signedData, data.signature, [data.address]);

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
    const signedData = await this.prepareSignatureBody(
      SignatureType.ENABLE_OPERATOR,
      user.evmAddress,
    );

    verifySignature(signedData, signature, [user.evmAddress]);

    let signer: Wallet;
    const currentWeb3Env = this.web3ConfigService.env;
    if (currentWeb3Env === Web3Env.MAINNET) {
      signer = this.web3Service.getSigner(ChainId.POLYGON);
    } else if (currentWeb3Env === Web3Env.TESTNET) {
      signer = this.web3Service.getSigner(ChainId.POLYGON_AMOY);
    } else {
      signer = this.web3Service.getSigner(ChainId.LOCALHOST);
    }

    const kvstore = await KVStoreClient.build(signer);

    const status = await kvstore.get(signer.address, user.evmAddress);

    if (status === OperatorStatus.ACTIVE) {
      throw new ControlledError(
        ErrorOperator.OperatorAlreadyActive,
        HttpStatus.BAD_REQUEST,
      );
    }

    await kvstore.set(user.evmAddress, OperatorStatus.ACTIVE);
  }

  public async disableOperator(
    user: UserEntity,
    signature: string,
  ): Promise<void> {
    const signedData = await this.prepareSignatureBody(
      SignatureType.DISABLE_OPERATOR,
      user.evmAddress,
    );

    verifySignature(signedData, signature, [user.evmAddress]);

    let signer: Wallet;
    const currentWeb3Env = this.web3ConfigService.env;
    if (currentWeb3Env === Web3Env.MAINNET) {
      signer = this.web3Service.getSigner(ChainId.POLYGON);
    } else if (currentWeb3Env === Web3Env.TESTNET) {
      signer = this.web3Service.getSigner(ChainId.POLYGON_AMOY);
    } else {
      signer = this.web3Service.getSigner(ChainId.LOCALHOST);
    }

    const kvstore = await KVStoreClient.build(signer);

    const status = await kvstore.get(signer.address, user.evmAddress);

    if (status === OperatorStatus.INACTIVE) {
      throw new ControlledError(
        ErrorOperator.OperatorNotActive,
        HttpStatus.BAD_REQUEST,
      );
    }

    await kvstore.set(user.evmAddress, OperatorStatus.INACTIVE);
  }

  public async prepareSignatureBody(
    type: SignatureType,
    address: string,
    additionalData?: { reference?: string; workerAddress?: string },
  ): Promise<SignatureBodyDto> {
    let content: string;
    let nonce: string | undefined;
    switch (type) {
      case SignatureType.SIGNUP:
        content = 'signup';
        break;
      case SignatureType.SIGNIN:
        content = 'signin';
        nonce = (await this.userRepository.findOneByAddress(address))?.nonce;
        break;
      case SignatureType.ENABLE_OPERATOR:
        content = 'enable-operator';
        break;
      case SignatureType.DISABLE_OPERATOR:
        content = 'disable-operator';
        break;
      case SignatureType.CERTIFICATE_AUTHENTICATION:
        if (
          !additionalData ||
          !additionalData.reference ||
          !additionalData.workerAddress
        ) {
          throw new ControlledError(
            'Missing necessary credential data',
            HttpStatus.BAD_REQUEST,
          );
        }
        content = JSON.stringify({
          reference: additionalData.reference,
          workerJson: additionalData.workerAddress.toLowerCase(),
        });
        break;
      case SignatureType.REGISTER_ADDRESS:
        content = 'register-address';
        break;
      default:
        throw new ControlledError('Type not allowed', HttpStatus.BAD_REQUEST);
    }

    return {
      from: address.toLowerCase(),
      to: this.web3Service.getOperatorAddress().toLowerCase(),
      contents: content,
      nonce: nonce ?? undefined,
    };
  }

  public async registerOracle(
    user: UserEntity,
    oracleAddress: string,
  ): Promise<void> {
    const newSiteKey = new SiteKeyEntity();
    newSiteKey.siteKey = oracleAddress;
    newSiteKey.type = SiteKeyType.REGISTRATION;
    newSiteKey.user = user;

    await this.siteKeyRepository.createUnique(newSiteKey);
  }

  public async getRegisteredOracles(user: UserEntity): Promise<string[]> {
    const siteKeys = await this.siteKeyRepository.findByUserAndType(
      user,
      SiteKeyType.REGISTRATION,
    );
    return siteKeys.map((siteKey) => siteKey.siteKey);
  }
}
