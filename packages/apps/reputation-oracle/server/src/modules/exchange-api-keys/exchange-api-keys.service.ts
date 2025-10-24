import { Inject, Injectable, forwardRef } from '@nestjs/common';

import { isValidExchangeName } from '@/common/validators/exchange';
import { AesEncryptionService } from '@/modules/encryption/aes-encryption.service';
import { ExchangeRouterService } from '@/modules/exchange/exchange.router.service';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import {
  ExchangeApiKeyNotFoundError,
  IncompleteKeySuppliedError,
  KeyAuthorizationError,
  ActiveExchangeApiKeyExistsError,
} from './exchange-api-keys.errors';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { UserNotFoundError, UserRepository } from '../user';

@Injectable()
export class ExchangeApiKeysService {
  constructor(
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
    private readonly userRepository: UserRepository,
    private readonly aesEncryptionService: AesEncryptionService,
    @Inject(forwardRef(() => ExchangeRouterService))
    private readonly exchangeRouterService: ExchangeRouterService,
  ) {}

  async enroll(input: {
    userId: number;
    exchangeName: string;
    apiKey: string;
    secretKey: string;
  }): Promise<ExchangeApiKeyEntity> {
    const { userId, exchangeName, apiKey, secretKey } = input;

    if (!userId || !apiKey || !secretKey) {
      throw new Error('Invalid arguments');
    }

    if (!isValidExchangeName(exchangeName)) {
      throw new Error('Exchange name is not valid');
    }

    const currentKeys =
      await this.exchangeApiKeysRepository.findOneByUserId(userId);
    if (currentKeys) {
      throw new ActiveExchangeApiKeyExistsError(userId);
    }

    const creds = { apiKey, secret: secretKey };
    if (
      !this.exchangeRouterService.checkRequiredCredentials(exchangeName, creds)
    ) {
      throw new IncompleteKeySuppliedError(exchangeName);
    }

    const hasRequiredAccess =
      await this.exchangeRouterService.checkRequiredAccess(exchangeName, creds);
    if (!hasRequiredAccess) {
      throw new KeyAuthorizationError(exchangeName);
    }

    const user = await this.userRepository.findOneById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const enrolledKey = new ExchangeApiKeyEntity();
    enrolledKey.userId = userId;
    enrolledKey.exchangeName = exchangeName;

    const [encryptedApiKey, encryptedSecretKey] = await Promise.all([
      this.aesEncryptionService.encrypt(Buffer.from(apiKey)),
      this.aesEncryptionService.encrypt(Buffer.from(secretKey)),
    ]);
    enrolledKey.apiKey = encryptedApiKey;
    enrolledKey.secretKey = encryptedSecretKey;
    enrolledKey.updatedAt = new Date();

    await this.exchangeApiKeysRepository.upsert(enrolledKey, [
      'userId',
      'exchangeName',
    ]);

    return enrolledKey;
  }

  async retrieve(
    userId: number,
    exchangeName: string,
  ): Promise<{ id: number; apiKey: string; secretKey: string }> {
    const entity =
      await this.exchangeApiKeysRepository.findOneByUserAndExchange(
        userId,
        exchangeName,
      );
    if (!entity) {
      throw new ExchangeApiKeyNotFoundError(userId, exchangeName);
    }

    const [decryptedApiKey, decryptedSecretKey] = await Promise.all([
      this.aesEncryptionService.decrypt(entity.apiKey),
      this.aesEncryptionService.decrypt(entity.secretKey),
    ]);

    return {
      id: entity.id,
      apiKey: decryptedApiKey.toString(),
      secretKey: decryptedSecretKey.toString(),
    };
  }
}
