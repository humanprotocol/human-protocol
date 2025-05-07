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
import { Encryption, EncryptionUtils, KVStoreUtils } from '@human-protocol/sdk';
import { Test } from '@nestjs/testing';

import { PGPConfigService, Web3ConfigService } from '../../config';
import {
  generateTestnetChainId,
  mockWeb3ConfigService,
} from '../web3/fixtures';
import { Web3Service } from '../web3';

import { PgpEncryptionService } from './pgp-encryption.service';

const mockedKVStoreUtils = jest.mocked(KVStoreUtils);

describe('PgpEncryptionService', () => {
  let mockPgpPublicKey: string;
  let mockPgpConfigService: Omit<PGPConfigService, 'configService'>;
  let pgpEncryptionService: PgpEncryptionService;

  beforeAll(async () => {
    const pgpPassphrase = faker.internet.password();
    const pgpKeyPairData = await EncryptionUtils.generateKeyPair(
      faker.string.sample(),
      faker.internet.email(),
      pgpPassphrase,
    );
    mockPgpPublicKey = pgpKeyPairData.publicKey;
    mockPgpConfigService = {
      encrypt: true,
      privateKey: pgpKeyPairData.privateKey,
      passphrase: pgpKeyPairData.passphrase,
    };

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

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('decrypt', () => {
    it('should decrypt data that encrypted for reputation oracle', async () => {
      const data = faker.lorem.words();
      const encryptedData = await EncryptionUtils.encrypt(data, [
        mockPgpPublicKey,
      ]);

      const decryptedData = await pgpEncryptionService.maybeDecryptFile(
        Buffer.from(encryptedData),
      );

      expect(decryptedData.toString()).toEqual(data);
    });
  });

  describe('maybeDecryptFile', () => {
    it('should return data "as is" if not encrypted', async () => {
      const data = Buffer.from(faker.lorem.words());

      const result = await pgpEncryptionService.maybeDecryptFile(data);

      expect(result).toEqual(data);
    });

    it('should return decrypted data if encrypted for Reputation Oracle', async () => {
      const data = faker.lorem.words();
      const encryptedData = await EncryptionUtils.encrypt(data, [
        mockPgpPublicKey,
      ]);

      const decryptedData = await pgpEncryptionService.maybeDecryptFile(
        Buffer.from(encryptedData),
      );

      expect(decryptedData.toString()).toEqual(data);
    });
  });

  describe('encrypt', () => {
    describe('when encryption disabled via config', () => {
      let originalConfigValue: boolean;

      beforeAll(() => {
        originalConfigValue = mockPgpConfigService.encrypt;
        (mockPgpConfigService as any).encrypt = false;
      });

      afterAll(() => {
        (mockPgpConfigService as any).encrypt = originalConfigValue;
      });

      it('should not encrypt content', async () => {
        const chainId = generateTestnetChainId();
        const content = faker.lorem.words();

        const result = await pgpEncryptionService.encrypt(
          Buffer.from(content),
          chainId,
        );

        expect(result).toEqual(content);
      });
    });

    describe('when encryption enabled via config', () => {
      const EXPECTED_PGP_PUBLIC_KEY_ERROR_MESSAGE =
        'Failed to get PGP public key for oracle';

      let originalConfigValue: boolean;

      beforeAll(() => {
        originalConfigValue = mockPgpConfigService.encrypt;
        (mockPgpConfigService as any).encrypt = true;
      });

      afterAll(() => {
        (mockPgpConfigService as any).encrypt = originalConfigValue;
      });

      it('should encrypt with reputation oracle public key as default', async () => {
        mockedKVStoreUtils.getPublicKey.mockImplementation(
          async (_chainId, address) => {
            if (address === mockWeb3ConfigService.operatorAddress) {
              return mockPgpPublicKey;
            }
            return '';
          },
        );

        const chainId = generateTestnetChainId();
        const content = faker.lorem.words();

        const encryptedContent = await pgpEncryptionService.encrypt(
          Buffer.from(content),
          chainId,
        );
        expect(EncryptionUtils.isEncrypted(encryptedContent)).toBe(true);

        const decryptedContent =
          await pgpEncryptionService.decrypt(encryptedContent);
        expect(decryptedContent.toString()).toEqual(content);
      });

      it('should throw if default public key is missing', async () => {
        const chainId = generateTestnetChainId();
        const content = faker.lorem.words();

        await expect(
          pgpEncryptionService.encrypt(Buffer.from(content), chainId),
        ).rejects.toThrow(EXPECTED_PGP_PUBLIC_KEY_ERROR_MESSAGE);
      });

      it('should throw if failing to get default public key', async () => {
        mockedKVStoreUtils.getPublicKey.mockRejectedValueOnce(
          new Error('Ooops'),
        );

        const chainId = generateTestnetChainId();
        const content = faker.lorem.words();

        await expect(
          pgpEncryptionService.encrypt(Buffer.from(content), chainId),
        ).rejects.toThrow(EXPECTED_PGP_PUBLIC_KEY_ERROR_MESSAGE);
      });

      it('should encrypt for provided oracle and default reputation oracle', async () => {
        const pgpPassphrase = faker.internet.password();
        const pgpKeyPairData = await EncryptionUtils.generateKeyPair(
          faker.string.sample(),
          faker.internet.email(),
          pgpPassphrase,
        );
        const otherOracleAddress = faker.finance.ethereumAddress();

        mockedKVStoreUtils.getPublicKey.mockImplementation(
          async (_chainId, address) => {
            if (address === otherOracleAddress) {
              return pgpKeyPairData.publicKey;
            }
            if (address === mockWeb3ConfigService.operatorAddress) {
              return mockPgpPublicKey;
            }
            return '';
          },
        );

        const chainId = generateTestnetChainId();
        const content = faker.lorem.words();

        const encryptedContent = await pgpEncryptionService.encrypt(
          Buffer.from(content),
          chainId,
          [otherOracleAddress],
        );
        expect(EncryptionUtils.isEncrypted(encryptedContent)).toBe(true);

        const repOracleDecryptedContent =
          await pgpEncryptionService.decrypt(encryptedContent);
        expect(repOracleDecryptedContent.toString()).toEqual(content);

        const encryptionSdk = await Encryption.build(
          pgpKeyPairData.privateKey,
          pgpKeyPairData.passphrase,
        );
        const otherOracleDecryptedContent =
          await encryptionSdk.decrypt(encryptedContent);
        expect(Buffer.from(otherOracleDecryptedContent).toString()).toEqual(
          content,
        );
      });
    });
  });
});
