import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { UserEntity } from './user.entity';
import { Web3UserDto } from './user.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(
    private dataSource: DataSource,
    private readonly userEntityRepository: Repository<UserEntity>,
  ) {
    super(UserEntity, dataSource);
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({ where: { email } });
  }

  public async findOneByEvmAddress(
    evmAddress: string,
  ): Promise<UserEntity | null> {
    return this.userEntityRepository.findOne({ where: { evmAddress } });
  }
}
