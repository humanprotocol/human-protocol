import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserEntity } from './user.entity';
import { UserStatus, UserType } from '../../common/enums/user';
import { UserBalanceDto, UserCreateDto } from './user.dto';
import { UserRepository } from './user.repository';
import { ValidatePasswordDto } from '../auth/auth.dto';
import { ErrorUser } from '../../common/constants/errors';
import { PaymentService } from '../payment/payment.service';
import { Currency } from '../../common/enums/payment';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private HASH_ROUNDS = 12;
  constructor(
    private userRepository: UserRepository,
    private readonly paymentService: PaymentService,
  ) {}

  public async create(dto: UserCreateDto): Promise<UserEntity> {
    const newUser = new UserEntity();
    newUser.email = dto.email;
    newUser.password = bcrypt.hashSync(dto.password, this.HASH_ROUNDS);
    newUser.type = UserType.REQUESTER;
    newUser.status = UserStatus.PENDING;
    await this.userRepository.createUnique(newUser);
    return newUser;
  }

  public async getByCredentials(
    email: string,
    password: string,
  ): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOne({
      where: {
        email,
      },
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
    return this.userRepository.findOne({ where: { email } });
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

  public async getBalance(userId: number): Promise<UserBalanceDto> {
    return {
      amount: await this.paymentService.getUserBalance(userId),
      currency: Currency.USD,
    };
  }
}
