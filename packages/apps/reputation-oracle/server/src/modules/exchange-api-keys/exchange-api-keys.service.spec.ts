import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';

import { EncryptionConfigService } from '@/config/encryption-config.service';
import { AesEncryptionService } from '@/modules/encryption/aes-encryption.service';
import { mockEncryptionConfigService } from '@/modules/encryption/fixtures';
import { ExchangeClientFactory } from '@/modules/exchange/exchange-client.factory';

// eslint-disable-next-line import/order
import { ExchangeApiKeysService } from './exchange-api-keys.service';
import { UserEntity, UserNotFoundError, UserRepository } from '@/modules/user';

import { ExchangeApiKeyEntity } from './exchange-api-key.entity';
import {
  ActiveExchangeApiKeyExistsError,
  KeyAuthorizationError,
} from './exchange-api-keys.errors';
import { ExchangeApiKeysRepository } from './exchange-api-keys.repository';
import {
  generateExchangeApiKey,
  generateExchangeApiKeysData,
} from './fixtures';
import { ExchangeClient } from '../exchange/types';

const mockUserRepository = createMock<UserRepository>();
const mockExchangeApiKeysRepository = createMock<ExchangeApiKeysRepository>();
const mockExchangeClient = createMock<ExchangeClient>();

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
          useValue: { create: () => mockExchangeClient },
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
    jest.resetAllMocks();
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

    it('should throw if not supported exchange name provided', async () => {
      const input = generateExchangeApiKeysData();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (input as any).exchangeName = input.exchangeName.toUpperCase();

      let thrownError;
      try {
        await exchangeApiKeysService.enroll(input);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError.constructor).toBe(Error);
      expect(thrownError.message).toBe('Exchange name is not valid');
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

    it('should throw if user already has active keys', async () => {
      const input = generateExchangeApiKeysData();
      mockExchangeApiKeysRepository.findOneByUserId.mockResolvedValueOnce(
        generateExchangeApiKey(),
      );

      let thrownError;
      try {
        await exchangeApiKeysService.enroll(input);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(ActiveExchangeApiKeyExistsError);
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
});
