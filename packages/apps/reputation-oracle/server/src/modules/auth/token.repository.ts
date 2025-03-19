import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource } from 'typeorm';
import { TokenEntity, TokenType } from './token.entity';

@Injectable()
export class TokenRepository extends BaseRepository<TokenEntity> {
  constructor(dataSource: DataSource) {
    super(TokenEntity, dataSource);
  }

  async findOneByUuidAndType(
    uuid: string,
    type: TokenType,
  ): Promise<TokenEntity | null> {
    return this.findOne({
      where: {
        uuid,
        type,
      },
    });
  }

  async findOneByUserIdAndType(
    userId: number,
    type: TokenType,
  ): Promise<TokenEntity | null> {
    return this.findOne({
      where: {
        userId,
        type,
      },
    });
  }

  async deleteOneByTypeAndUserId(
    type: TokenType,
    userId: number,
  ): Promise<void> {
    await this.delete({ type, userId });
  }
}
