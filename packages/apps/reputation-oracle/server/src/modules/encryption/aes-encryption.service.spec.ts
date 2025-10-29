import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';

import { EncryptionConfigService } from '@/config';

import { AesEncryptionService } from './aes-encryption.service';
import { generateAesEncryptionKey } from './fixtures';

const HEX_FORMAT_REGEX = /[0-9a-f]+/;

const mockGetAesEncryptionKey = jest.fn();

const mockEncryptionConfigService: Omit<
  EncryptionConfigService,
  'configService'
> = {
  get aesEncryptionKey() {
    return mockGetAesEncryptionKey();
  },
};

describe('AesEncryptionService', () => {
  let aesEncryptionService: AesEncryptionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: EncryptionConfigService,
          useValue: mockEncryptionConfigService,
        },
        AesEncryptionService,
      ],
    }).compile();

    aesEncryptionService =
      moduleRef.get<AesEncryptionService>(AesEncryptionService);
  });

  beforeEach(() => {
    mockGetAesEncryptionKey.mockReturnValue(generateAesEncryptionKey());
  });

  it('should be defined', () => {
    expect(aesEncryptionService).toBeDefined();
  });

  it('should encrypt data and return envelope string', async () => {
    const data = faker.lorem.lines();

    const envelope = await aesEncryptionService.encrypt(Buffer.from(data));

    expect(typeof envelope).toBe('string');

    const [authTag, encrypted, iv] = envelope.split(':');

    expect(authTag).toMatch(HEX_FORMAT_REGEX);
    expect(authTag).toHaveLength(24);

    expect(encrypted).toMatch(HEX_FORMAT_REGEX);

    expect(iv).toHaveLength(32);
    expect(iv).toMatch(HEX_FORMAT_REGEX);
  });

  it('should decrypt data encrypted by itslef', async () => {
    const data = faker.lorem.lines();

    const encrypted = await aesEncryptionService.encrypt(Buffer.from(data));
    const decrypted = await aesEncryptionService.decrypt(encrypted);

    expect(decrypted.toString()).toBe(data);
  });

  it('should fail to decrypt if different encryption key used', async () => {
    mockGetAesEncryptionKey.mockReturnValueOnce(generateAesEncryptionKey());
    mockGetAesEncryptionKey.mockReturnValueOnce(generateAesEncryptionKey());

    const data = faker.lorem.lines();

    const encrypted = await aesEncryptionService.encrypt(Buffer.from(data));

    await expect(aesEncryptionService.decrypt(encrypted)).rejects.toThrow();
  });
});
