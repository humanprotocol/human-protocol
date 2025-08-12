import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, In } from 'typeorm';

import { BaseRepository } from '@/database';

import { Role, UserEntity } from './user.entity';

type FindOptions = {
  relations?: FindManyOptions<UserEntity>['relations'];
};

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(dataSource: DataSource) {
    super(UserEntity, dataSource);
  }

  async findOneById(
    id: number,
    options: FindOptions = {},
  ): Promise<UserEntity | null> {
    if (!id) {
      throw new Error('Invalid arguments');
    }
    return this.findOne({
      where: { id },
      relations: options.relations,
    });
  }

  async findOneByEmail(
    email: string,
    options: FindOptions = {},
  ): Promise<UserEntity | null> {
    if (!email) {
      throw new Error('Invalid arguments');
    }
    return this.findOne({
      where: { email },
      relations: options.relations,
    });
  }

  async findOneByAddress(
    address: string,
    options: FindOptions = {},
  ): Promise<UserEntity | null> {
    if (!address) {
      throw new Error('Invalid arguments');
    }
    return this.findOne({
      where: {
        evmAddress: address.toLowerCase(),
      },
      relations: options.relations,
    });
  }

  async findWorkersByAddresses(addresses: string[]): Promise<UserEntity[]> {
    const lowercasedAddresses = addresses.map((address) =>
      address.toLowerCase(),
    );

    return this.find({
      where: {
        role: Role.WORKER,
        evmAddress: In(lowercasedAddresses),
      },
    });
  }
}
