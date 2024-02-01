import { Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { handleQueryFailedError } from '../../database/database.error';
import { ApiKeyEntity } from './apikey.entity';

@Injectable()
export class ApiKeyRepository extends Repository<ApiKeyEntity> {
  constructor(private dataSource: DataSource) {
    super(ApiKeyEntity, dataSource.createEntityManager());
  }

  async createOrUpdateAPIKey(
    userId: number,
    hashedAPIKey: string,
    salt: string,
  ): Promise<ApiKeyEntity> {
    let apiKeyEntity = await this.findAPIKeyByUserId(userId);
    try {
      if (!apiKeyEntity) {
        apiKeyEntity = new ApiKeyEntity();
        apiKeyEntity.user.id = userId;
        await this.insert(apiKeyEntity);
      }

      apiKeyEntity.hashedAPIKey = hashedAPIKey;
      apiKeyEntity.salt = salt;

      return this.save(apiKeyEntity);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
  }

  public async findAPIKeyByUserId(
    userId: number,
  ): Promise<ApiKeyEntity | null> {
    return this.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findAPIKeyById(apiKeyId: number): Promise<ApiKeyEntity | null> {
    return this.findOne({
      where: { id: apiKeyId },
      relations: ['user'],
    });
  }
}
