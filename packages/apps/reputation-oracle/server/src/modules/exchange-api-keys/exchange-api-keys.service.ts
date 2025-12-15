import { Injectable } from '@nestjs/common';

import {
  SUPPORTED_EXCHANGE_NAMES,
  SupportedExchange,
} from '@/common/constants';
import { isValidExchangeName } from '@/common/validators/exchange';
import { StakingConfigService } from '@/config';
import { AesEncryptionService } from '@/modules/encryption/aes-encryption.service';
import { ExchangeClientFactory } from '@/modules/exchange/exchange-client.factory';
import { UserNotFoundError, UserRepository } from '@/modules/user';
import { Web3Service } from '@/modules/web3';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import {
  ActiveExchangeApiKeyExistsError,
  ExchangeApiKeyNotFoundError,
  KeyAuthorizationError,
} from './exchange-api-keys.errors';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import { StakeSummaryData } from './types';

@Injectable()
export class ExchangeApiKeysService {
  constructor(
    private readonly aesEncryptionService: AesEncryptionService,
    private readonly exchangeApiKeysRepository: ExchangeApiKeysRepository,
    private readonly exchangeClientFactory: ExchangeClientFactory,
    private readonly userRepository: UserRepository,
    private readonly web3Service: Web3Service,
    private readonly stakingConfigService: StakingConfigService,
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
      throw new ActiveExchangeApiKeyExistsError(userId, exchangeName);
    }

    const client = await this.exchangeClientFactory.create(exchangeName, {
      apiKey,
      secretKey,
    });
    const hasRequiredAccess = await client.checkRequiredAccess();
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
    await this.exchangeApiKeysRepository.createUnique(enrolledKey);

    return enrolledKey;
  }

  async retrieve(userId: number): Promise<{
    exchangeName: string;
    apiKey: string;
    secretKey: string;
  } | null> {
    const entity = await this.exchangeApiKeysRepository.findOneByUserId(userId);
    if (!entity) {
      return null;
    }

    const [decryptedApiKey, decryptedSecretKey] = await Promise.all([
      this.aesEncryptionService.decrypt(entity.apiKey),
      this.aesEncryptionService.decrypt(entity.secretKey),
    ]);

    return {
      exchangeName: entity.exchangeName,
      apiKey: decryptedApiKey.toString(),
      secretKey: decryptedSecretKey.toString(),
    };
  }

  async getExchangeStakedBalance(userId: number): Promise<number> {
    const apiKeys = await this.retrieve(userId);
    if (!apiKeys) {
      throw new ExchangeApiKeyNotFoundError(userId);
    }

    const client = await this.exchangeClientFactory.create(
      apiKeys.exchangeName as SupportedExchange,
      {
        apiKey: apiKeys.apiKey,
        secretKey: apiKeys.secretKey,
      },
      { timeoutMs: this.stakingConfigService.timeoutMs },
    );

    return client.getAccountBalance(this.stakingConfigService.asset);
  }

  async getStakeSummary(userId: number): Promise<StakeSummaryData> {
    const user = await this.userRepository.findOneById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const exchangeStake = await this.getExchangeStakedBalance(userId);
    let onChainStake = 0;
    if (user.evmAddress)
      onChainStake = await this.web3Service.getStakedBalance(user.evmAddress);

    return {
      exchangeStake,
      onChainStake,
      minThreshold: this.stakingConfigService.minThreshold,
    };
  }

  getSupportedExchanges(): string[] {
    return [...SUPPORTED_EXCHANGE_NAMES];
  }
}
