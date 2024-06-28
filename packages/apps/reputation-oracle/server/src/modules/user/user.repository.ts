import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { UserEntity } from './user.entity';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource);
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.findOne({
      where: { id },
      relations: { kyc: true, siteKey: true, ndas: true },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({
      where: { email },
      relations: { kyc: true, siteKey: true, ndas: true },
    });
  }

  async findByAddress(address: string): Promise<UserEntity | null> {
    return this.findOne({
      where: { evmAddress: address },
      relations: { kyc: true, siteKey: true, ndas: true },
    });
  }

  public async findOneByEvmAddress(
    evmAddress: string,
  ): Promise<UserEntity | null> {
    return this.findOne({ where: { evmAddress } });
  }
}
