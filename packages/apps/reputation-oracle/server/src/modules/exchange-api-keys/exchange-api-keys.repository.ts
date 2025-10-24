import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions, Repository } from 'typeorm';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';

type FindOptions = {
  relations?: FindManyOptions<ExchangeApiKeyEntity>['relations'];
};

@Injectable()
export class ExchangeApiKeysRepository extends Repository<ExchangeApiKeyEntity> {
  constructor(dataSource: DataSource) {
    super(ExchangeApiKeyEntity, dataSource.createEntityManager());
  }

  async findOneByUserId(
    userId: number,
    options: FindOptions = {},
  ): Promise<ExchangeApiKeyEntity | null> {
    if (!userId) {
      throw new Error('Invalid arguments');
    }
    return this.findOne({
      where: { userId },
      relations: options.relations,
    });
  }

  async listExchangesByUserId(userId: number): Promise<string[]> {
    if (!userId) {
      throw new Error('userId is required');
    }

    const results: Array<Pick<ExchangeApiKeyEntity, 'exchangeName'>> =
      await this.find({
        where: {
          userId,
        },
        select: {
          exchangeName: true,
        },
      });

    return results.map((r) => r.exchangeName);
  }

  async deleteByUserAndExchange(
    userId: number,
    exchangeName: string,
  ): Promise<void> {
    if (!userId) {
      throw new Error('userId is required');
    }
    if (!exchangeName) {
      throw new Error('exchangeName is required');
    }

    await this.delete({ userId, exchangeName });
  }

  async findOneByUserAndExchange(
    userId: number,
    exchangeName: string,
  ): Promise<ExchangeApiKeyEntity | null> {
    if (!userId) {
      throw new Error('userId is required');
    }
    if (!exchangeName) {
      throw new Error('exchangeName is required');
    }

    return this.findOneBy({
      userId,
      exchangeName,
    });
  }

  async findByUserId(userId: number): Promise<ExchangeApiKeyEntity[]> {
    if (!userId) {
      throw new Error('userId is required');
    }

    return this.find({
      where: {
        userId,
      },
    });
  }
}
