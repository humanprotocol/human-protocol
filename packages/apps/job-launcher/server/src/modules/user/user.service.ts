import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserEntity } from './user.entity';
import { UserStatus, UserType } from '../../common/enums/user';
import { UserCreateDto } from './user.dto';
import { UserRepository } from './user.repository';
import { ValidatePasswordDto } from '../auth/auth.dto';

@Injectable()
export class UserService {
  private HASH_ROUNDS = 12;
  constructor(private userRepository: UserRepository) {}

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
}
