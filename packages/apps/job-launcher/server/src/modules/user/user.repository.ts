import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindConditions,
  FindManyOptions,
  FindOneOptions,
  Not,
  Repository,
  getRepository,
} from 'typeorm';

import { UserEntity } from './user.entity';
import { UserCreateDto, UserUpdateDto } from './user.dto';
import { ErrorUser } from '../../common/constants/errors';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: Repository<UserEntity>,
  ) {}

  public async updateOne(
    where: FindConditions<UserEntity>,
    dto: Partial<UserUpdateDto>,
  ): Promise<UserEntity> {
    const userEntity = await this.userEntityRepository.findOne(where);

    if (!userEntity) {
      this.logger.log(ErrorUser.NotFound, UserRepository.name);
      throw new NotFoundException(ErrorUser.NotFound);
    }

    Object.assign(userEntity, dto);
    return userEntity.save();
  }

  public async findOne(
    where: FindConditions<UserEntity>,
    options?: FindOneOptions<UserEntity>,
  ): Promise<UserEntity | undefined> {
    const userEntity = await this.userEntityRepository.findOne({
      where,
      ...options,
    });
    console.log({
      where,
      ...options,
    });

    return userEntity;
  }

  public find(
    where: FindConditions<UserEntity>,
    options?: FindManyOptions<UserEntity>,
  ): Promise<UserEntity[]> {
    return this.userEntityRepository.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      ...options,
    });
  }

  public async create(dto: UserCreateDto): Promise<UserEntity> {
    return this.userEntityRepository.create(dto).save();
  }
}
