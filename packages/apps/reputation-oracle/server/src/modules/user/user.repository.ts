import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from '../../database/base.repository';
import { UserEntity } from './user.entity';
import { Role, UserStatus } from '../../common/enums/user';

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource);
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.findOne({
      where: { id },
      relations: { kyc: true, siteKeys: true },
    });
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({
      where: { email },
      relations: { kyc: true, siteKeys: true },
    });
  }

  async findOneByAddress(address: string): Promise<UserEntity | null> {
    return this.findOne({
      where: { evmAddress: address.toLowerCase() },
      relations: { kyc: true, siteKeys: true },
    });
  }

  async findByEmail(
    emails: string[],
    role?: Role,
    status?: UserStatus,
  ): Promise<UserEntity[]> {
    const whereConditions = emails.map((email) => {
      const condition: any = { email };
      if (role) {
        condition.role = role;
      }
      if (status) {
        condition.status = status;
      }
      return condition;
    });

    return this.find({
      where: whereConditions,
      relations: { kyc: true, siteKeys: true },
    });
  }

  async findByAddress(
    addresses: string[],
    role?: Role,
    status?: UserStatus,
  ): Promise<UserEntity[]> {
    const whereConditions = addresses.map((address) => {
      const condition: any = { evmAddress: address.toLowerCase() };
      if (role) {
        condition.role = role;
      }
      if (status) {
        condition.status = status;
      }
      return condition;
    });

    return this.find({
      where: whereConditions,
      relations: { kyc: true, siteKeys: true },
    });
  }
}
