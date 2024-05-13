import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  ErrorAuth,
  ErrorOperator,
  ErrorUser,
} from '../../common/constants/errors';
import {
  KycStatus,
  OperatorStatus,
  UserStatus,
  UserType,
} from '../../common/enums/user';
import { getNonce, verifySignature } from '../../common/utils/signature';
import { UserEntity } from './user.entity';
import {
  RegisterAddressRequestDto,
  UserCreateDto,
  Web3UserCreateDto,
} from './user.dto';
import { UserRepository } from './user.repository';
import { ValidatePasswordDto } from '../auth/auth.dto';
import { Web3Service } from '../web3/web3.service';
import { Wallet } from 'ethers';
import { SignatureType, Web3Env } from '../../common/enums/web3';
import { ChainId, KVStoreClient } from '@human-protocol/sdk';
import { Web3ConfigService } from '../../common/config/web3-config.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private HASH_ROUNDS = 12;
  constructor(
    private userRepository: UserRepository,
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
  ) {}

  public async create(dto: UserCreateDto): Promise<UserEntity> {
    const newUser = new UserEntity();
    newUser.email = dto.email;
    newUser.password = bcrypt.hashSync(dto.password, this.HASH_ROUNDS);
    newUser.type = UserType.WORKER;
    newUser.status = UserStatus.PENDING;
    await this.userRepository.createUnique(newUser);
    return newUser;
  }

  public async getByCredentials(
    email: string,
    password: string,
  ): Promise<UserEntity | null> {
    const userEntity = await this.userRepository.findByEmail(email);

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
    return userEntity.save();
  }

  public async createWeb3User(
    dto: Web3UserCreateDto,
    address: string,
  ): Promise<UserEntity> {
    await this.checkEvmAddress(address);

    const newUser = new UserEntity();
    newUser.evmAddress = dto.evmAddress;
    newUser.nonce = getNonce();
    newUser.type = UserType.OPERATOR;
    newUser.status = UserStatus.ACTIVE;

    await this.userRepository.createUnique(newUser);
    return newUser;
  }

  public async checkEvmAddress(address: string): Promise<void> {
    const userEntity = await this.userRepository.findOneByEvmAddress(address);

    if (userEntity) {
      this.logger.log(ErrorUser.AccountCannotBeRegistered, UserService.name);
      throw new ConflictException(ErrorUser.AccountCannotBeRegistered);
    }
  }

  public async getByAddress(address: string): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOneByEvmAddress(address);

    if (!userEntity) {
      throw new NotFoundException(ErrorUser.NotFound);
    }

    return userEntity;
  }

  public async updateNonce(userEntity: UserEntity): Promise<UserEntity> {
    userEntity.nonce = getNonce();
    return userEntity.save();
  }

  public async registerAddress(
    user: UserEntity,
    data: RegisterAddressRequestDto,
  ): Promise<string> {
    if (user.evmAddress && user.evmAddress !== data.address) {
      throw new BadRequestException(ErrorUser.IncorrectAddress);
    }

    if (user.kyc?.status !== KycStatus.APPROVED) {
      throw new BadRequestException(ErrorUser.KycNotApproved);
    }

    user.evmAddress = data.address;
    await user.save();

    return await this.web3Service
      .getSigner(data.chainId)
      .signMessage(data.address);
  }

  public async disableOperator(
    user: UserEntity,
    signature: string,
  ): Promise<void> {
    const signedData = this.web3Service.prepareSignatureBody(
      SignatureType.DISABLE_OPERATOR,
      user.evmAddress,
    );

    const verified = verifySignature(signedData, signature, [user.evmAddress]);
    if (!verified) {
      throw new UnauthorizedException(ErrorAuth.InvalidSignature);
    }

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
      throw new BadRequestException(ErrorOperator.OperatorNotActive);
    }

    await kvstore.set(user.evmAddress, OperatorStatus.INACTIVE);
  }
}
