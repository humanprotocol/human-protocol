import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BaseRepository } from '@/database';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';

@Injectable()
export class ExchangeApiKeysRepository extends BaseRepository<ExchangeApiKeyEntity> {
  constructor(dataSource: DataSource) {
    super(ExchangeApiKeyEntity, dataSource);
  }

  async findOneByUserId(userId: number): Promise<ExchangeApiKeyEntity | null> {
    if (!userId) {
      throw new Error('Invalid arguments');
    }
    return this.findOne({
      where: { userId },
    });
  }

  async deleteByUser(userId: number): Promise<void> {
    if (!userId) {
      throw new Error('userId is required');
    }

    await this.delete({ userId });
  }
}
