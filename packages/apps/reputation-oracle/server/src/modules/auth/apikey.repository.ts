import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource } from 'typeorm';
import { ApiKeyEntity } from './apikey.entity';

@Injectable()
export class ApiKeyRepository extends BaseRepository<ApiKeyEntity> {
  constructor(private dataSource: DataSource) {
    super(ApiKeyEntity, dataSource);
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
