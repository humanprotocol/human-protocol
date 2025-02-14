import {
  ChainId,
  Encryption,
  EncryptionUtils,
  EscrowClient,
  KVStoreUtils,
} from '@human-protocol/sdk';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ENCRYPTION_PUBLIC_KEY,
  MOCK_FILE_HASH,
  MOCK_FILE_URL,
  mockConfig,
} from '../../../test/constants';
import { StorageService } from './storage.service';
import crypto from 'crypto';
import { Web3Service } from '../web3/web3.service';
import { PGPConfigService } from '../../config/pgp-config.service';
import { S3ConfigService } from '../../config/s3-config.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn(),
  },
  Encryption: {
    build: jest.fn(),
  },
  EncryptionUtils: {
    encrypt: jest.fn(),
    isEncrypted: jest.fn(),
  },
  KVStoreUtils: {
    getPublicKey: jest.fn(),
  },
}));

jest.mock('minio', () => {
  class Client {
    putObject = jest.fn();
    bucketExists = jest.fn();
    statObject = jest.fn();
    constructor() {
      (this as any).protocol = 'http:';
      (this as any).host = 'localhost';
      (this as any).port = 9000;
    }
  }

  return { Client };
});

jest.mock('axios');

describe('StorageService', () => {
  let storageService: StorageService;
  let pgpConfigService: PGPConfigService;
  let s3ConfigService: S3ConfigService;
  let downloadFileFromUrlSpy: jest.SpyInstance;

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: ChainId.LOCALHOST }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
        PGPConfigService,
        S3ConfigService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);
    pgpConfigService = moduleRef.get<PGPConfigService>(PGPConfigService);
    s3ConfigService = moduleRef.get<S3ConfigService>(S3ConfigService);

    const jobLauncherAddress = '0x1234567890123456789012345678901234567893';
    EscrowClient.build = jest.fn().mockResolvedValue({
      getJobLauncherAddress: jest.fn().mockResolvedValue(jobLauncherAddress),
    });
    KVStoreUtils.getPublicKey = jest
      .fn()
      .mockResolvedValue(MOCK_ENCRYPTION_PUBLIC_KEY);
    jest.spyOn(pgpConfigService, 'encrypt', 'get').mockReturnValue(true);
  });

  beforeEach(() => {
    downloadFileFromUrlSpy = jest.spyOn(StorageService, 'downloadFileFromUrl');
  });

  describe('uploadJobSolutions', () => {
    it('should upload the solutions correctly', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(true);
      storageService.minioClient.statObject = jest
        .fn()
        .mockRejectedValueOnce({ code: 'NotFound' });

      EncryptionUtils.encrypt = jest.fn().mockResolvedValueOnce('encrypted');

      const jobSolution = {
        workerAddress,
        solution,
      };
      const fileData = await storageService.uploadJobSolutions(
        escrowAddress,
        chainId,
        [jobSolution],
      );

      const hash = crypto.createHash('sha1').update('encrypted').digest('hex');
      expect(fileData).toEqual({
        url: `http://${s3ConfigService.endpoint}:${s3ConfigService.port}/${s3ConfigService.bucket}/${hash}.json`,
        hash,
      });
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        s3ConfigService.bucket,
        `${hash}.json`,
        expect.stringContaining('encrypted'),
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );
    });

    describe('without encryption', () => {
      beforeAll(() => {
        jest.spyOn(pgpConfigService, 'encrypt', 'get').mockReturnValue(false);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      afterAll(() => {
        jest.spyOn(pgpConfigService, 'encrypt', 'get').mockReturnValue(true);
      });

      it('should upload the solutions', async () => {
        const workerAddress = '0x1234567890123456789012345678901234567891';
        const escrowAddress = '0x1234567890123456789012345678901234567890';
        const chainId = ChainId.LOCALHOST;
        const solution = 'test';

        storageService.minioClient.bucketExists = jest
          .fn()
          .mockResolvedValueOnce(true);

        storageService.minioClient.statObject = jest
          .fn()
          .mockRejectedValueOnce({ code: 'NotFound' });

        EncryptionUtils.encrypt = jest.fn().mockResolvedValueOnce('encrypted');

        const jobSolution = {
          workerAddress,
          solution,
        };
        const fileData = await storageService.uploadJobSolutions(
          escrowAddress,
          chainId,
          [jobSolution],
        );

        const content = JSON.stringify([jobSolution]);
        const hash = crypto.createHash('sha1').update(content).digest('hex');
        expect(fileData).toEqual({
          url: `http://${s3ConfigService.endpoint}:${s3ConfigService.port}/${s3ConfigService.bucket}/${hash}.json`,
          hash,
        });
        expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
          s3ConfigService.bucket,
          `${hash}.json`,
          expect.stringContaining(content),
          {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        );
      });
    });

    it('should return the URL of the file and a hash if it already exists', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      const hash = crypto.createHash('sha1').update('encrypted').digest('hex');
      const results = {
        url: `http://${s3ConfigService.endpoint}:${s3ConfigService.port}/${s3ConfigService.bucket}/${hash}.json`,
        hash,
      };

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(true);
      storageService.minioClient.statObject = jest
        .fn()
        .mockResolvedValueOnce({ url: MOCK_FILE_URL, hash: MOCK_FILE_HASH });

      EncryptionUtils.encrypt = jest.fn().mockResolvedValueOnce('encrypted');

      const jobSolution = {
        workerAddress,
        solution,
      };

      const result = await storageService.uploadJobSolutions(
        escrowAddress,
        chainId,
        [jobSolution],
      );

      expect(result).toEqual(results);
    });

    it('should fail if the bucket does not exist', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(false);

      storageService.minioClient.statObject = jest
        .fn()
        .mockRejectedValueOnce({ code: 'NotFound' });

      const jobSolution = {
        workerAddress,
        solution,
      };
      await expect(
        storageService.uploadJobSolutions(escrowAddress, chainId, [
          jobSolution,
        ]),
      ).rejects.toThrow('Bucket not found');
    });

    it('should fail if the file cannot be uploaded', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(true);
      storageService.minioClient.statObject = jest
        .fn()
        .mockRejectedValueOnce({ code: 'NotFound' });
      storageService.minioClient.putObject = jest
        .fn()
        .mockRejectedValueOnce('Network error');

      const jobSolution = {
        workerAddress,
        solution,
      };

      await expect(
        storageService.uploadJobSolutions(escrowAddress, chainId, [
          jobSolution,
        ]),
      ).rejects.toThrow('File not uploaded');
    });
  });

  describe('downloadJsonLikeData', () => {
    it('should download data correctly', async () => {
      const exchangeAddress = '0x1234567890123456789012345678901234567892';
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'test';

      const expectedJobJson = {
        exchangeAddress,
        solutions: [
          {
            workerAddress,
            solution,
          },
        ],
      };

      downloadFileFromUrlSpy.mockResolvedValueOnce(
        Buffer.from(JSON.stringify(expectedJobJson)),
      );

      const solutionsJson =
        await storageService.downloadJsonLikeData(MOCK_FILE_URL);
      expect(solutionsJson).toEqual(expectedJobJson);
    });

    it('should download the encrypted data correctly', async () => {
      const exchangeAddress = '0x1234567890123456789012345678901234567892';
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'test';

      const expectedJobJson = {
        exchangeAddress,
        solutions: [
          {
            workerAddress,
            solution,
          },
        ],
      };

      downloadFileFromUrlSpy.mockResolvedValueOnce(Buffer.from('encrypted'));
      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);
      Encryption.build = jest.fn().mockResolvedValue({
        decrypt: jest.fn().mockResolvedValue(JSON.stringify(expectedJobJson)),
      });

      const solutionsJson =
        await storageService.downloadJsonLikeData(MOCK_FILE_URL);
      expect(solutionsJson).toEqual(expectedJobJson);
    });

    it('should return empty array when data cannot be downloaded', async () => {
      downloadFileFromUrlSpy.mockRejectedValue('Network error');

      const solutionsJson =
        await storageService.downloadJsonLikeData(MOCK_FILE_URL);
      expect(solutionsJson).toEqual([]);
    });
  });

  describe('copyFileFromURLToBucket', () => {
    const someFileContent = Buffer.from('some-file-content');
    const escrowAddress = '0x1234567890123456789012345678901234567890';
    const chainId = ChainId.LOCALHOST;

    it('should copy a file from a valid URL to a bucket', async () => {
      downloadFileFromUrlSpy.mockResolvedValueOnce(someFileContent);

      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(false);
      EncryptionUtils.encrypt = jest
        .fn()
        .mockResolvedValueOnce('encrypted-file-content');

      storageService.minioClient.statObject = jest
        .fn()
        .mockRejectedValueOnce({ code: 'NotFound' });
      storageService.minioClient.putObject = jest
        .fn()
        .mockResolvedValueOnce(true);

      const uploadedFile = await storageService.copyFileFromURLToBucket(
        escrowAddress,
        chainId,
        MOCK_FILE_URL,
      );

      expect(
        uploadedFile.url.includes(
          `http://${s3ConfigService.endpoint}:${s3ConfigService.port}/${s3ConfigService.bucket}/`,
        ),
      ).toBeTruthy();
      expect(uploadedFile.hash).toBeDefined();
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        s3ConfigService.bucket,
        `s3${crypto
          .createHash('sha1')
          .update('encrypted-file-content')
          .digest('hex')}.zip`,
        'encrypted-file-content',
        {
          'Cache-Control': 'no-store',
          'Content-Type': 'text/plain',
        },
      );
    });

    it('should copy an encrypted file from a valid URL to a bucket', async () => {
      downloadFileFromUrlSpy.mockResolvedValueOnce(someFileContent);
      Encryption.build = jest.fn().mockResolvedValue({
        decrypt: jest.fn().mockResolvedValue('decrypted-file-content'),
      });

      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);
      EncryptionUtils.encrypt = jest
        .fn()
        .mockResolvedValueOnce('encrypted-file-content');

      storageService.minioClient.statObject = jest
        .fn()
        .mockRejectedValueOnce({ code: 'NotFound' });

      const uploadedFile = await storageService.copyFileFromURLToBucket(
        escrowAddress,
        chainId,
        MOCK_FILE_URL,
      );

      expect(
        uploadedFile.url.includes(
          `http://${s3ConfigService.endpoint}:${s3ConfigService.port}/${s3ConfigService.bucket}/`,
        ),
      ).toBeTruthy();
      expect(uploadedFile.hash).toBeDefined();
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        s3ConfigService.bucket,
        `s3${crypto
          .createHash('sha1')
          .update('encrypted-file-content')
          .digest('hex')}.zip`,
        'encrypted-file-content',
        {
          'Cache-Control': 'no-store',
          'Content-Type': 'text/plain',
        },
      );
    });

    it('should return the URL of the file and a hash if it already exists', async () => {
      downloadFileFromUrlSpy.mockResolvedValueOnce(someFileContent);
      Encryption.build = jest.fn().mockResolvedValue({
        decrypt: jest.fn().mockResolvedValue('decrypted-file-content'),
      });

      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);
      EncryptionUtils.encrypt = jest
        .fn()
        .mockResolvedValueOnce('encrypted-file-content');

      storageService.minioClient.statObject = jest
        .fn()
        .mockResolvedValueOnce({ url: MOCK_FILE_URL, hash: MOCK_FILE_HASH });

      const uploadedFile = await storageService.copyFileFromURLToBucket(
        escrowAddress,
        chainId,
        MOCK_FILE_URL,
      );

      expect(
        uploadedFile.url.includes(
          `http://${s3ConfigService.endpoint}:${s3ConfigService.port}/${s3ConfigService.bucket}/`,
        ),
      ).toBeTruthy();
      expect(uploadedFile.hash).toBeDefined();
    });

    describe('without encryption', () => {
      beforeAll(() => {
        jest.spyOn(pgpConfigService, 'encrypt', 'get').mockReturnValue(false);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      afterAll(() => {
        jest.spyOn(pgpConfigService, 'encrypt', 'get').mockReturnValue(true);
      });

      it('should copy a file from a valid URL to a bucket', async () => {
        downloadFileFromUrlSpy.mockResolvedValueOnce(someFileContent);

        EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(false);

        storageService.minioClient.statObject = jest
          .fn()
          .mockRejectedValueOnce({ code: 'NotFound' });
        storageService.minioClient.putObject = jest
          .fn()
          .mockResolvedValueOnce(true);

        const uploadedFile = await storageService.copyFileFromURLToBucket(
          escrowAddress,
          chainId,
          MOCK_FILE_URL,
        );

        expect(
          uploadedFile.url.includes(
            `http://${s3ConfigService.endpoint}:${s3ConfigService.port}/${s3ConfigService.bucket}/`,
          ),
        ).toBeTruthy();
        expect(uploadedFile.hash).toBeDefined();
        expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
          s3ConfigService.bucket,
          `s3${crypto
            .createHash('sha1')
            .update('some-file-content')
            .digest('hex')}.zip`,
          someFileContent,
          {
            'Cache-Control': 'no-store',
            'Content-Type': 'text/plain',
          },
        );
      });

      it('should copy an encrypted file from a valid URL to a bucket', async () => {
        downloadFileFromUrlSpy.mockResolvedValueOnce(someFileContent);

        EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);
        Encryption.build = jest.fn().mockResolvedValue({
          decrypt: jest.fn().mockResolvedValue(someFileContent),
        });

        EncryptionUtils.encrypt = jest
          .fn()
          .mockResolvedValueOnce('encrypted-file-content');

        storageService.minioClient.statObject = jest
          .fn()
          .mockRejectedValueOnce({ code: 'NotFound' });

        const uploadedFile = await storageService.copyFileFromURLToBucket(
          escrowAddress,
          chainId,
          MOCK_FILE_URL,
        );

        expect(
          uploadedFile.url.includes(
            `http://${s3ConfigService.endpoint}:${s3ConfigService.port}/${s3ConfigService.bucket}/`,
          ),
        ).toBeTruthy();
        expect(uploadedFile.hash).toBeDefined();
        expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
          s3ConfigService.bucket,
          `s3${crypto
            .createHash('sha1')
            .update(someFileContent)
            .digest('hex')}.zip`,
          someFileContent,
          {
            'Cache-Control': 'no-store',
            'Content-Type': 'text/plain',
          },
        );
      });
    });

    it('should handle an invalid URL', async () => {
      await expect(
        storageService.copyFileFromURLToBucket(
          escrowAddress,
          chainId,
          'invalid url',
        ),
      ).rejects.toThrow('File not uploaded');
    });
  });
});
