import * as crypto from 'crypto';
import { generateHash } from 'src/common/utils/crypto';
import { ConfigService } from '@nestjs/config';
import { ApiKeyService } from './apikey.service';
import { ApiKeyRepository } from './apikey.repository';
import { createMock } from '@golevelup/ts-jest';
import { ApiKeyEntity } from './apikey.entity';
import { UserEntity } from '../user/user.entity';

jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
}));

jest.mock('src/common/utils/crypto', () => ({
  generateHash: jest.fn(),
}));

describe('ApiKeyService', () => {
  let apiKeyService: ApiKeyService;
  let apiKeyRepository: ApiKeyRepository;
  let configService: ConfigService;
  let randomBytesCallCount = 0;

  beforeEach(() => {
    randomBytesCallCount = 0;
    apiKeyRepository = createMock<ApiKeyRepository>();
    configService = createMock<ConfigService>();
    apiKeyService = new ApiKeyService(apiKeyRepository, configService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrUpdateAPIKey', () => {
    it('should create a new API key, save it and return it', async () => {
      const userId = 1;
      const salt = 'someRandomSalt';
      const apiKey = 'someRandomApiKey';
      const hashedAPIKey = 'someHashedAPIKey';
      let randomBytesCallCount = 0;
      jest.spyOn(crypto, 'randomBytes').mockImplementation((size, callback) => {
        let buffer;
        if (randomBytesCallCount === 0) {
          buffer = Buffer.from(salt); // Return salt for the first call
        } else if (randomBytesCallCount === 1) {
          buffer = Buffer.from(apiKey); // Return apiKey for the second call
        } else {
          // Return a default value or handle additional calls as needed
          buffer = Buffer.from('defaultvalue');
        }
        randomBytesCallCount += 1;

        if (typeof callback === 'function') {
          callback(null, buffer);
        }
        return buffer;
      });
      (generateHash as jest.Mock).mockResolvedValue(hashedAPIKey);
      (configService.get as jest.Mock)
        .mockReturnValueOnce(1000) // Iterations
        .mockReturnValueOnce(64); // Key length

      const result = await apiKeyService.createOrUpdateAPIKey(userId);

      expect(result).toEqual(apiKey);
      expect(apiKeyRepository.createOrUpdateAPIKey).toHaveBeenCalledWith(
        userId,
        hashedAPIKey,
        salt,
      );
    });

    it('should generate correct salt and API key', async () => {
      const salt = 'someRandomSalt';
      const apiKey = 'someRandomApiKey';
      const hashedAPIKey = 'someHashedAPIKey';
      const userId = 1;

      const mockApiKeyEntity = new ApiKeyEntity();
      mockApiKeyEntity.id = 1;
      mockApiKeyEntity.hashedAPIKey = hashedAPIKey;
      mockApiKeyEntity.salt = salt;
      mockApiKeyEntity.user = new UserEntity(); // You might need to fill in required fields for UserEntity as well
      mockApiKeyEntity.createdAt = new Date();
      mockApiKeyEntity.updatedAt = new Date();

      let randomBytesCallCount = 0;

      jest.spyOn(crypto, 'randomBytes').mockImplementation((size) => {
        if (randomBytesCallCount === 0) {
          randomBytesCallCount += 1;
          return Buffer.from(salt);
        } else if (randomBytesCallCount === 1) {
          randomBytesCallCount += 1;
          return Buffer.from(apiKey);
        }
        return Buffer.from('defaultvalue');
      });

      (generateHash as jest.Mock).mockResolvedValue(hashedAPIKey);

      const createOrUpdateAPIKeySpy = jest
        .spyOn(apiKeyRepository, 'createOrUpdateAPIKey')
        .mockResolvedValueOnce(mockApiKeyEntity);

      const result = await apiKeyService.createOrUpdateAPIKey(userId);

      expect(result).toEqual(apiKey);
      expect(createOrUpdateAPIKeySpy).toHaveBeenCalledWith(
        userId,
        hashedAPIKey,
        salt,
      );
    });
  });
});
