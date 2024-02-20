import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, DeleteResult } from 'typeorm';
import { AuthEntity } from './auth.entity';

@Injectable()
export class AuthRepository extends BaseRepository<AuthEntity> {
  constructor(private dataSource: DataSource) {
    super(AuthEntity, dataSource);
  }

  public async findOneByUserId(userId: number): Promise<AuthEntity | null> {
    return this.findOne({
      where: { userId: userId },
      relations: ['user'],
    });
  }

  public async deleteByUserId(userId: number): Promise<DeleteResult> {
    return this.delete({ userId });
  }
}
