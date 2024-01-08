import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { TokenEntity } from './token.entity';
import { TokenCreateDto } from './auth.dto';

@Injectable()
export class TokenRepository {
  private readonly logger = new Logger(TokenRepository.name);

  constructor(
    @InjectRepository(TokenEntity)
    private readonly tokenEntityRepository: Repository<TokenEntity>,
  ) {}

  public async findOne(
    where: FindOptionsWhere<TokenEntity>,
  ): Promise<TokenEntity | null> {
    const tokenEntity = await this.tokenEntityRepository.findOne({
      where,
      relations: ['user'],
    });

    return tokenEntity;
  }

  public async create(dto: TokenCreateDto): Promise<TokenEntity> {
    return this.tokenEntityRepository.create(dto).save();
  }
}
