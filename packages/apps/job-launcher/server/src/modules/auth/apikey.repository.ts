import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyEntity } from './apikey.entity';
import { ErrorUser } from '../../common/constants/errors';

@Injectable()
export class ApiKeyRepository {
  private readonly logger = new Logger(ApiKeyRepository.name);

  constructor(
    @InjectRepository(ApiKeyEntity)
    private readonly apiKeyRepository: Repository<ApiKeyEntity>,
  ) {}

  async createOrUpdateAPIKey(userId: number, hashedAPIKey: string, salt: string): Promise<ApiKeyEntity> {
    let apiKeyEntity = await this.findAPIKeyByUserId(userId);

    if (!apiKeyEntity) {
      apiKeyEntity = this.apiKeyRepository.create({ user: { id: userId } });
    }

    apiKeyEntity.hashedAPIKey = hashedAPIKey;
    apiKeyEntity.salt = salt;

    return this.apiKeyRepository.save(apiKeyEntity);
  }

  public async findAPIKeyByUserId(userId: number): Promise<ApiKeyEntity | null> {
    return this.apiKeyRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findAPIKeyByHash(hashedAPIKey: string): Promise<ApiKeyEntity | null> {
    return this.apiKeyRepository.findOne({
      where: { hashedAPIKey },
      relations: ['user'],
    });
  }

  async findAPIKeyById(apiKeyId: number): Promise<ApiKeyEntity | null> {
    return this.apiKeyRepository.findOne({
      where: { id: apiKeyId },
      relations: ['user'],
    });
  }  
}
