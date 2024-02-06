import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, DeleteResult } from 'typeorm';
import { TokenEntity, TokenType } from './token.entity';

@Injectable()
export class TokenRepository extends BaseRepository<TokenEntity> {
  constructor(private dataSource: DataSource) {
    super(TokenEntity, dataSource);
  }

  public async findOneByUuidAndTokenType(
    uuid: string,
    tokenType: TokenType,
  ): Promise<TokenEntity | null> {
    return this.findOne({
      where: {
        uuid,
        tokenType,
      },
      relations: ['user'],
    });
  }

  public async findOneByUserIdAndTokenType(
    userId: number,
    tokenType: TokenType,
  ): Promise<TokenEntity | null> {
    return this.findOne({
      where: {
        userId,
        tokenType,
      },
      relations: ['user'],
    });
  }

  public async deleteOne(token: TokenEntity): Promise<DeleteResult> {
    return this.delete({ id: token.id });
  }
}
