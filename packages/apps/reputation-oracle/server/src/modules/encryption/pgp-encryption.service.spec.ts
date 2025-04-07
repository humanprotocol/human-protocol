jest.mock('@human-protocol/sdk', () => {
  const actualSdk = jest.requireActual('@human-protocol/sdk');
  const mockedSdk = jest.createMockFromModule<
    typeof import('@human-protocol/sdk')
  >('@human-protocol/sdk');

  return {
    ...actualSdk,
    KVStoreUtils: mockedSdk.KVStoreUtils,
  };
});

import { faker } from '@faker-js/faker';
import { EncryptionUtils } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';

import { PGPConfigService } from '../../config/pgp-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';
import {
  generateTestnetChainId,
  mockWeb3ConfigService,
} from '../web3/fixtures';
import { Web3Service } from '../web3/web3.service';

import { MOCK_PGP_PUBLIC_KEY, mockPgpConfigService } from './fixtures';
import { PgpEncryptionService } from './pgp-encryption.service';

describe('PgpEncryptionService', () => {
  let pgpEncryptionService: PgpEncryptionService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
        Web3Service,
        {
          provide: PGPConfigService,
          useValue: mockPgpConfigService,
        },
        PgpEncryptionService,
      ],
    }).compile();

    pgpEncryptionService =
      moduleRef.get<PgpEncryptionService>(PgpEncryptionService);

    await pgpEncryptionService.onModuleInit();
  });

  describe('encrypt', () => {
    it('should not encrypt if encryption disabled via config', async () => {
      const originalConfigValue = mockPgpConfigService.encrypt;
      (mockPgpConfigService as any).encrypt = false;

      const chainId = generateTestnetChainId();
      const content = faker.lorem.words();

      const result = await pgpEncryptionService.encrypt(
        Buffer.from(content),
        chainId,
      );

      expect(result).toEqual(content);

      (mockPgpConfigService as any).encrypt = originalConfigValue;
    });
  });

  describe('maybeDecryptFile', () => {
    it('should return data "as is" if not encrypted', async () => {
      const data = Buffer.from(faker.lorem.words());

      const result = await pgpEncryptionService.maybeDecryptFile(data);

      expect(result).toEqual(data);
    });

    it('should return decrypted data if encrypted', async () => {
      const data = faker.lorem.words();
      const encryptedData = await EncryptionUtils.encrypt(data, [
        MOCK_PGP_PUBLIC_KEY,
      ]);

      const decryptedData = await pgpEncryptionService.maybeDecryptFile(
        Buffer.from(encryptedData),
      );

      expect(decryptedData.toString()).toEqual(data);
    });
  });
});
