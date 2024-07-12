import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Not } from 'typeorm';
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
  UserUpdateDto,
} from './user.dto';
import { UserRepository } from './user.repository';
import { ValidatePasswordDto } from '../auth/auth.dto';
import { Web3Service } from '../web3/web3.service';
import { Wallet } from 'ethers';
import { ConfigNames } from '../../common/config';
import { SignatureType, Web3Env } from '../../common/enums/web3';
import { ChainId, KVStoreClient } from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private HASH_ROUNDS = 12;
  constructor(
    private userRepository: UserRepository,
    private readonly web3Service: Web3Service,
    private readonly configService: ConfigService,
  ) {}

  public async update(userId: number, dto: UserUpdateDto): Promise<UserEntity> {
    return this.userRepository.updateOne({ id: userId }, dto);
  }

  public async create(dto: UserCreateDto): Promise<UserEntity> {
    const { email, password, ...rest } = dto;

    await this.checkEmail(email, 0);

    return await this.userRepository.create({
      ...rest,
      email,
      password: bcrypt.hashSync(password, this.HASH_ROUNDS),
      status: UserStatus.PENDING,
    });
  }

  public async getByCredentials(
    email: string,
    password: string,
  ): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOne({
      email,
    });

    if (!userEntity) {
      throw new NotFoundException(ErrorUser.InvalidCredentials);
    }

    if (!bcrypt.compareSync(password, userEntity.password)) {
      throw new NotFoundException(ErrorUser.InvalidCredentials);
    }

    return userEntity;
  }

  public async getByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ email });
  }

  public updatePassword(
    userEntity: UserEntity,
    data: ValidatePasswordDto,
  ): Promise<UserEntity> {
    userEntity.password = bcrypt.hashSync(data.password, this.HASH_ROUNDS);
    return userEntity.save();
  }

  public activate(userEntity: UserEntity): Promise<UserEntity> {
    userEntity.status = UserStatus.ACTIVE;
    return userEntity.save();
  }

  public async checkEmail(email: string, id: number): Promise<void> {
    const userEntity = await this.userRepository.findOne({
      email,
      id: Not(id),
    });

    if (userEntity) {
      this.logger.log(ErrorUser.AccountCannotBeRegistered, UserService.name);
      throw new ConflictException(ErrorUser.AccountCannotBeRegistered);
    }
  }

  public async createWeb3User(
    address: string,
    type: UserType,
  ): Promise<UserEntity> {
    await this.checkEvmAddress(address);

    return await this.userRepository.createWeb3User({
      evmAddress: address,
      nonce: getNonce(),
      status: UserStatus.ACTIVE,
      type,
    });
  }

  public async checkEvmAddress(address: string): Promise<void> {
    const userEntity = await this.userRepository.findOne({
      evmAddress: address,
    });

    if (userEntity) {
      this.logger.log(ErrorUser.AccountCannotBeRegistered, UserService.name);
      throw new ConflictException(ErrorUser.AccountCannotBeRegistered);
    }
  }

  public async getByAddress(address: string): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOne({
      evmAddress: address,
    });

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
    const currentWeb3Env = this.configService.get(ConfigNames.WEB3_ENV);
    if (currentWeb3Env === Web3Env.MAINNET) {
      signer = this.web3Service.getSigner(ChainId.POLYGON);
    } else {
      signer = this.web3Service.getSigner(ChainId.POLYGON_MUMBAI);
    }

    const kvstore = await KVStoreClient.build(signer);

    const status = await kvstore.get(signer.address, user.evmAddress);

    if (status === OperatorStatus.INACTIVE) {
      throw new BadRequestException(ErrorOperator.OperatorNotActive);
    }

    await kvstore.set(user.evmAddress, 'ACTIVE');
  }
}
