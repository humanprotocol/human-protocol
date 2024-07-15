import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../database/base.repository';
import { DataSource, DeleteResult } from 'typeorm';
import { TokenEntity, TokenType } from './token.entity';

@Injectable()
export class TokenRepository extends BaseRepository<TokenEntity> {
  constructor(private dataSource: DataSource) {
    super(TokenEntity, dataSource);
  }

  public async findOneByUuidAndType(
    uuid: string,
    type: TokenType,
  ): Promise<TokenEntity | null> {
    return this.findOne({
      where: {
        uuid,
        type,
      },
      relations: ['user', 'user.kyc', 'user.siteKey'],
    });
  }

  public async findOneByUserIdAndType(
    userId: number,
    type: TokenType,
  ): Promise<TokenEntity | null> {
    return this.findOne({
      where: {
        userId,
        type,
      },
      relations: ['user'],
    });
  }

  public async deleteOneByTypeAndUserId(
    type: TokenType,
    userId: number,
  ): Promise<DeleteResult> {
    return this.delete({ type, userId });
  }
}
