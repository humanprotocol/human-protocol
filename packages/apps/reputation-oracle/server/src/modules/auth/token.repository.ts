import { Injectable } from '@nestjs/common';
import { DataSource, FindManyOptions } from 'typeorm';

import { BaseRepository } from '../../database';
import { TokenEntity, TokenType } from './token.entity';

type FindOptions = {
  relations?: FindManyOptions<TokenEntity>['relations'];
};

@Injectable()
export class TokenRepository extends BaseRepository<TokenEntity> {
  constructor(dataSource: DataSource) {
    super(TokenEntity, dataSource);
  }

  async findOneByUuidAndType(
    uuid: string,
    type: TokenType,
    options: FindOptions = {},
  ): Promise<TokenEntity | null> {
    return this.findOne({
      where: {
        uuid,
        type,
      },
      relations: options.relations,
    });
  }

  async findOneByUserIdAndType(
    userId: number,
    type: TokenType,
    options: FindOptions = {},
  ): Promise<TokenEntity | null> {
    return this.findOne({
      where: {
        userId,
        type,
      },
      relations: options.relations,
    });
  }

  async deleteOneByTypeAndUserId(
    type: TokenType,
    userId: number,
  ): Promise<void> {
    await this.delete({ type, userId });
  }
}
