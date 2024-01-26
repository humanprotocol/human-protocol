import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { handleQueryFailedError } from '../../database/handleQueryFailedError';

@Injectable()
export class UserRepository extends Repository<UserEntity> {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private dataSource: DataSource) {
    super(UserEntity, dataSource.createEntityManager());
  }

  async createUnique(user: UserEntity): Promise<UserEntity> {
    try {
      await this.insert(user);
    } catch (error) {
      console.log(error);
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return user;
  }
}
