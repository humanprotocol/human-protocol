import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Not } from 'typeorm';

import { UserEntity } from './user.entity';
import { UserStatus, UserType } from '../../common/enums/user';
import { UserCreateDto, UserUpdateDto } from './user.dto';
import { UserRepository } from './user.repository';
import { ValidatePasswordDto } from '../auth/auth.dto';
import { ErrorUser } from '../../common/constants/errors';
import { PaymentService } from '../payment/payment.service';
import { IUserBalance } from '../../common/interfaces';
import { Currency } from '../../common/enums/payment';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private HASH_ROUNDS = 12;
  constructor(
    private userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly paymentService: PaymentService,
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
      type: UserType.REQUESTER,
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

  public async getBalance(userId: number): Promise<IUserBalance> {
    return {
      amount: await this.paymentService.getUserBalance(userId),
      currency: Currency.USD,
    };
  }
}
