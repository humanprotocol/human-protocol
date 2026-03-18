import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { SUPPORTED_EXCHANGES_INFO } from '@/common/constants';
import { EncryptionConfigService } from '@/config/encryption-config.service';
import { AesEncryptionService } from '@/modules/encryption/aes-encryption.service';
import { mockEncryptionConfigService } from '@/modules/encryption/fixtures';
import { ExchangeClientFactory } from '@/modules/exchange/exchange-client.factory';

// eslint-disable-next-line import-x/order
import { ExchangeApiKeysService } from './exchange-api-keys.service';
import { UserEntity, UserNotFoundError, UserRepository } from '@/modules/user';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import { KeyAuthorizationError } from './exchange-api-keys.errors';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import {
  generateExchangeApiKey,
  generateExchangeApiKeysData,
} from './fixtures';
import { ExchangeClient } from '../exchange/types';

const mockUserRepository = createMock<UserRepository>();
const mockExchangeApiKeysRepository = createMock<ExchangeApiKeysRepository>();
const mockExchangeClient = createMock<ExchangeClient>();
const mockExchangeClientFactory = {
  create: jest.fn().mockReturnValue(mockExchangeClient),
};

describe('ExchangeApiKeysService', () => {
  let exchangeApiKeysService: ExchangeApiKeysService;
  let aesEncryptionService: AesEncryptionService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeApiKeysService,
        AesEncryptionService,
        { provide: UserRepository, useValue: mockUserRepository },
        {
          provide: ExchangeApiKeysRepository,
          useValue: mockExchangeApiKeysRepository,
        },
        {
          provide: EncryptionConfigService,
          useValue: mockEncryptionConfigService,
        },
        {
          provide: ExchangeClientFactory,
          useValue: mockExchangeClientFactory,
        },
      ],
    }).compile();

    exchangeApiKeysService = module.get<ExchangeApiKeysService>(
      ExchangeApiKeysService,
    );
    aesEncryptionService =
      module.get<AesEncryptionService>(AesEncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(exchangeApiKeysService).toBeDefined();
  });

  describe('enroll', () => {
    it.each([
      Object.assign(generateExchangeApiKeysData(), { userId: '' }),
      Object.assign(generateExchangeApiKeysData(), { apiKey: '' }),
      Object.assign(generateExchangeApiKeysData(), { secretKey: '' }),
    ])('should throw if required param is missing [%#]', async (input) => {
      let thrownError;
      try {
        await exchangeApiKeysService.enroll(input);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.constructor).toBe(Error);
      expect(thrownError.message).toBe('Invalid arguments');
    });

    it('should throw if provided keys do not have required access', async () => {
      mockExchangeApiKeysRepository.findOneByUserId.mockResolvedValueOnce(null);
      mockExchangeClient.checkRequiredAccess.mockResolvedValueOnce(false);

      const input = generateExchangeApiKeysData();

      let thrownError;
      try {
        await exchangeApiKeysService.enroll(input);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(KeyAuthorizationError);
      expect(thrownError.exchangeName).toBe(input.exchangeName);
    });

    it('should overwrite existing keys if user already has active ones', async () => {
      const input = generateExchangeApiKeysData();
      const existingKey = generateExchangeApiKey();
      mockExchangeApiKeysRepository.findOneByUserId.mockResolvedValueOnce(
        existingKey,
      );
      mockExchangeClient.checkRequiredAccess.mockResolvedValueOnce(true);
      mockUserRepository.findOneById.mockResolvedValueOnce({
        id: input.userId,
      } as UserEntity);
      mockExchangeApiKeysRepository.updateOne.mockImplementation(
        async (entity) => entity,
      );

      const updatedEntity = await exchangeApiKeysService.enroll(input);

      expect(mockExchangeApiKeysRepository.updateOne).toHaveBeenCalledWith(
        existingKey,
      );
      const [decryptedApiKey, decryptedSecretKey] = await Promise.all([
        aesEncryptionService.decrypt(updatedEntity.apiKey),
        aesEncryptionService.decrypt(updatedEntity.secretKey),
      ]);
      expect(decryptedApiKey.toString()).toBe(input.apiKey);
      expect(decryptedSecretKey.toString()).toBe(input.secretKey);
    });

    it('should throw if user not exists', async () => {
      mockExchangeApiKeysRepository.findOneByUserId.mockResolvedValueOnce(null);
      mockExchangeClient.checkRequiredAccess.mockResolvedValueOnce(true);

      mockUserRepository.findOneById.mockResolvedValueOnce(null);

      const input = generateExchangeApiKeysData();

      let thrownError;
      try {
        await exchangeApiKeysService.enroll(input);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(UserNotFoundError);
    });

    it('should insert encrypted keys if data is valid', async () => {
      mockExchangeApiKeysRepository.findOneByUserId.mockResolvedValueOnce(null);
      mockExchangeClient.checkRequiredAccess.mockResolvedValueOnce(true);
      mockUserRepository.findOneById.mockResolvedValueOnce({
        id: 1,
      } as UserEntity);

      const input = generateExchangeApiKeysData();

      const entity = await exchangeApiKeysService.enroll(input);

      expect(entity.userId).toBe(input.userId);
      expect(entity.exchangeName).toBe(input.exchangeName);
      expect(entity.apiKey).not.toBe(input.apiKey);
      expect(entity.secretKey).not.toBe(input.secretKey);

      const [decryptedApiKey, decryptedSecretKey] = await Promise.all([
        aesEncryptionService.decrypt(entity.apiKey),
        aesEncryptionService.decrypt(entity.secretKey),
      ]);

      expect(decryptedApiKey.toString()).toBe(input.apiKey);
      expect(decryptedSecretKey.toString()).toBe(input.secretKey);
    });
  });

  describe('retrieve', () => {
    it('should return null if key not found for the user', async () => {
      const { userId } = generateExchangeApiKeysData();
      mockExchangeApiKeysRepository.findOneByUserId.mockResolvedValueOnce(null);

      const result = await exchangeApiKeysService.retrieve(userId);
      expect(result).toBeNull();
    });

    it('should return decrypted keys', async () => {
      const { userId, exchangeName, apiKey, secretKey } =
        generateExchangeApiKeysData();

      const [encryptedApiKey, encryptedSecretKey] = await Promise.all([
        aesEncryptionService.encrypt(Buffer.from(apiKey)),
        aesEncryptionService.encrypt(Buffer.from(secretKey)),
      ]);
      mockExchangeApiKeysRepository.findOneByUserId.mockResolvedValueOnce({
        exchangeName,
        apiKey: encryptedApiKey,
        secretKey: encryptedSecretKey,
      } as ExchangeApiKeyEntity);

      const result = await exchangeApiKeysService.retrieve(userId);

      expect(result).not.toBeNull();
      expect(result!.apiKey).toBe(apiKey);
      expect(result!.secretKey).toBe(secretKey);
      expect(
        mockExchangeApiKeysRepository.findOneByUserId,
      ).toHaveBeenCalledWith(userId);
    });
  });

  describe('getSupportedExchanges', () => {
    it('returns a copy of supported exchanges constant', () => {
      const result = exchangeApiKeysService.getSupportedExchanges();

      expect(result).toEqual(SUPPORTED_EXCHANGES_INFO);
      expect(result).not.toBe(SUPPORTED_EXCHANGES_INFO);
    });
  });
});
