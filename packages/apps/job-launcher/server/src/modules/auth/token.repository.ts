import { Injectable } from '@nestjs/common';
import { handleQueryFailedError } from '../../database/database.error';
import {
  DataSource,
  DeleteResult,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { TokenEntity, TokenType } from './token.entity';

@Injectable()
export class TokenRepository extends Repository<TokenEntity> {
  constructor(private dataSource: DataSource) {
    super(TokenEntity, dataSource.createEntityManager());
  }

  async createUnique(token: TokenEntity): Promise<TokenEntity> {
    try {
      await this.insert(token);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw handleQueryFailedError(error);
      } else {
        throw error;
      }
    }
    return token;
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
