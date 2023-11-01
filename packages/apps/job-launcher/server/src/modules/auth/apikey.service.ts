import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ApiKeyRepository } from './apikey.repository';
import { UserEntity } from '../user/user.entity';
import { promisify } from 'util';
import { generateHash } from 'src/common/utils/crypto';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from 'src/common/config';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);
  private readonly iterations: number;
  private readonly keyLength: number;

  constructor(private readonly apiKeyRepository: ApiKeyRepository, private readonly configService: ConfigService) {
    this.iterations = this.configService.get<number>(ConfigNames.APIKEY_ITERATIONS, 1000);
    this.keyLength = this.configService.get<number>(ConfigNames.APIKEY_KEY_LENGTH, 64);
  }

  async createOrUpdateAPIKey(userId: number): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const apiKey = crypto.randomBytes(32).toString('hex');
    const hashedAPIKey = await generateHash(apiKey, salt, this.iterations, this.keyLength);

    await this.apiKeyRepository.createOrUpdateAPIKey(userId, hashedAPIKey, salt);

    return apiKey;
  }

  async validateAPIKey(userId: number, apiKey: string): Promise<boolean> {
    const apiKeyEntity = await this.apiKeyRepository.findAPIKeyByUserId(userId);
  
    if (!apiKeyEntity) {
      this.logger.log('API Key Entity not found', ApiKeyService.name);
      throw new NotFoundException('API Key Entity not found');
    }
    
    const hash = await generateHash(apiKey, apiKeyEntity.salt, this.iterations, this.keyLength);

    return hash === apiKeyEntity.hashedAPIKey;
  }

  async validateAPIKeyAndGetUser(apiKeyId: number, apiKey: string): Promise<UserEntity | null> {
    const apiKeyEntity = await this.apiKeyRepository.findAPIKeyById(apiKeyId);
  
    if (!apiKeyEntity) {
      this.logger.log('API Key Entity not found', ApiKeyService.name);
      throw new NotFoundException('API Key Entity not found');
    }
    const hash = await generateHash(apiKey, apiKeyEntity.salt, this.iterations, this.keyLength);

    const isValid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(apiKeyEntity.hashedAPIKey));
    if (isValid) {
      return apiKeyEntity.user;
    }
  
    return null;
  }
  
}
