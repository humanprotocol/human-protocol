import { faker } from '@faker-js/faker';

export const mockEncryptionConfigService = {
  // 32-byte key for AES-256-GCM tests
  aesEncryptionKey: faker.string.sample(32),
};
