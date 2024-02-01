import { Injectable } from '@nestjs/common';
import { handleQueryFailedError } from '../../database/database.error';
import {
  DataSource,
  DeleteResult,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { AuthEntity } from './auth.entity';

@Injectable()
export class AuthRepository extends Repository<AuthEntity> {
  constructor(private dataSource: DataSource) {
    super(AuthEntity, dataSource.createEntityManager());
  }

  async createUnique(auth: AuthEntity): Promise<AuthEntity> {
    try {
      await this.insert(auth);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return auth;
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
