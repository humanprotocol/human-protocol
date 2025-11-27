import { faker } from '@faker-js/faker';

export const mockEncryptionConfigService = {
  // 32-byte key for AES-256-GCM tests
  aesEncryptionKey: generateAesEncryptionKey(),
};

/**
 * Generates random key for AES encryption
 * with the key length .expected by the app
 */
export function generateAesEncryptionKey(): string {
  return faker.string.sample(32);
}
