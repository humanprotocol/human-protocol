import {
  ChainId,
  Encryption,
  EncryptionUtils,
  EscrowClient,
  OperatorUtils,
  StorageClient,
} from '@human-protocol/sdk';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ENCRYPTION_PRIVATE_KEY,
  MOCK_ENCRYPTION_PUBLIC_KEY,
  MOCK_FILE_URL,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../../test/constants';
import { StorageService } from './storage.service';
import crypto from 'crypto';
import { Web3Service } from '../web3/web3.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  StorageClient: {
    downloadFileFromUrl: jest.fn(),
  },
  EscrowClient: {
    build: jest.fn(),
  },
  OperatorUtils: {
    getLeader: jest.fn(),
  },
  Encryption: {
    build: jest.fn(),
  },
  EncryptionUtils: {
    encrypt: jest.fn(),
    isEncrypted: jest.fn(),
  },
}));

jest.mock('minio', () => {
  class Client {
    putObject = jest.fn();
    bucketExists = jest.fn();
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

  let encrypt = true;

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: ChainId.LOCALHOST }),
  };

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'ENCRYPTION_PRIVATE_KEY':
            return MOCK_ENCRYPTION_PRIVATE_KEY;
          case 'PGP_ENCRYPT':
            return encrypt;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forFeature(
          registerAs('s3', () => ({
            accessKey: MOCK_S3_ACCESS_KEY,
            secretKey: MOCK_S3_SECRET_KEY,
            endPoint: MOCK_S3_ENDPOINT,
            port: MOCK_S3_PORT,
            useSSL: MOCK_S3_USE_SSL,
            bucket: MOCK_S3_BUCKET,
          })),
        ),
      ],
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);

    const jobLauncherAddress = '0x1234567890123456789012345678901234567893';
    EscrowClient.build = jest.fn().mockResolvedValue({
      getJobLauncherAddress: jest.fn().mockResolvedValue(jobLauncherAddress),
    });
    OperatorUtils.getLeader = jest.fn().mockResolvedValue({
      publicKey: MOCK_ENCRYPTION_PUBLIC_KEY,
    });
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
        url: `http://${MOCK_S3_ENDPOINT}:${MOCK_S3_PORT}/${MOCK_S3_BUCKET}/${hash}.json`,
        hash,
      });
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        MOCK_S3_BUCKET,
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
        encrypt = false;
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      afterAll(() => {
        encrypt = true;
      });

      it('should upload the solutions', async () => {
        const workerAddress = '0x1234567890123456789012345678901234567891';
        const escrowAddress = '0x1234567890123456789012345678901234567890';
        const chainId = ChainId.LOCALHOST;
        const solution = 'test';

        storageService.minioClient.bucketExists = jest
          .fn()
          .mockResolvedValueOnce(true);

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
          url: `http://${MOCK_S3_ENDPOINT}:${MOCK_S3_PORT}/${MOCK_S3_BUCKET}/${hash}.json`,
          hash,
        });
        expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
          MOCK_S3_BUCKET,
          `${hash}.json`,
          expect.stringContaining(content),
          {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        );
      });
    });

    it('should fail if the bucket does not exist', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(false);

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

  describe('download', () => {
    it('should download the file correctly', async () => {
      const exchangeAddress = '0x1234567890123456789012345678901234567892';
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'test';

      const expectedJobFile = {
        exchangeAddress,
        solutions: [
          {
            workerAddress,
            solution,
          },
        ],
      };

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce(expectedJobFile);
      const solutionsFile = await storageService.download(MOCK_FILE_URL);
      expect(solutionsFile).toStrictEqual(expectedJobFile);
    });

    it('should download the encrypted file correctly', async () => {
      const exchangeAddress = '0x1234567890123456789012345678901234567892';
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'test';

      const expectedJobFile = {
        exchangeAddress,
        solutions: [
          {
            workerAddress,
            solution,
          },
        ],
      };

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce('encrypted');
      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);
      Encryption.build = jest.fn().mockResolvedValue({
        decrypt: jest.fn().mockResolvedValue(expectedJobFile),
      });

      const solutionsFile = await storageService.download(MOCK_FILE_URL);
      expect(solutionsFile).toStrictEqual(expectedJobFile);
    });

    it('should return empty array when file cannot be downloaded', async () => {
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockRejectedValue('Network error');

      const solutionsFile = await storageService.download(MOCK_FILE_URL);
      expect(solutionsFile).toStrictEqual([]);
    });
  });

  describe('copyFileFromURLToBucket', () => {
    const escrowAddress = '0x1234567890123456789012345678901234567890';
    const chainId = ChainId.LOCALHOST;

    it('should copy a file from a valid URL to a bucket', async () => {
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce('some-file-content');

      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(false);
      EncryptionUtils.encrypt = jest
        .fn()
        .mockResolvedValueOnce('encrypted-file-content');

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
          `http://${MOCK_S3_ENDPOINT}:${MOCK_S3_PORT}/${MOCK_S3_BUCKET}/`,
        ),
      ).toBeTruthy();
      expect(uploadedFile.hash).toBeDefined();
      expect(storageService.minioClient.putObject).toBeCalledWith(
        MOCK_S3_BUCKET,
        `s3${crypto
          .createHash('sha1')
          .update('encrypted-file-content')
          .digest('hex')}.zip`,
        'encrypted-file-content',
        { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
      );
    });

    it('should copy an encrypted file from a valid URL to a bucket', async () => {
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValueOnce('some-file-content');
      Encryption.build = jest.fn().mockResolvedValue({
        decrypt: jest.fn().mockResolvedValue('decrypted-file-content'),
      });

      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);
      EncryptionUtils.encrypt = jest
        .fn()
        .mockResolvedValueOnce('encrypted-file-content');

      const uploadedFile = await storageService.copyFileFromURLToBucket(
        escrowAddress,
        chainId,
        MOCK_FILE_URL,
      );

      expect(
        uploadedFile.url.includes(
          `http://${MOCK_S3_ENDPOINT}:${MOCK_S3_PORT}/${MOCK_S3_BUCKET}/`,
        ),
      ).toBeTruthy();
      expect(uploadedFile.hash).toBeDefined();
      expect(storageService.minioClient.putObject).toBeCalledWith(
        MOCK_S3_BUCKET,
        `s3${crypto
          .createHash('sha1')
          .update('encrypted-file-content')
          .digest('hex')}.zip`,
        'encrypted-file-content',
        { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
      );
    });

    describe('without encryption', () => {
      beforeAll(() => {
        encrypt = false;
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      afterAll(() => {
        encrypt = true;
      });

      it('should copy a file from a valid URL to a bucket', async () => {
        StorageClient.downloadFileFromUrl = jest
          .fn()
          .mockResolvedValueOnce('some-file-content');

        EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(false);
        EncryptionUtils.encrypt = jest
          .fn()
          .mockResolvedValueOnce('encrypted-file-content');

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
            `http://${MOCK_S3_ENDPOINT}:${MOCK_S3_PORT}/${MOCK_S3_BUCKET}/`,
          ),
        ).toBeTruthy();
        expect(uploadedFile.hash).toBeDefined();
        expect(storageService.minioClient.putObject).toBeCalledWith(
          MOCK_S3_BUCKET,
          `s3${crypto
            .createHash('sha1')
            .update('some-file-content')
            .digest('hex')}.zip`,
          'some-file-content',
          { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
        );
      });

      it('should copy an encrypted file from a valid URL to a bucket', async () => {
        StorageClient.downloadFileFromUrl = jest
          .fn()
          .mockResolvedValueOnce('some-file-content');
        Encryption.build = jest.fn().mockResolvedValue({
          decrypt: jest.fn().mockResolvedValue('decrypted-file-content'),
        });

        EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);
        EncryptionUtils.encrypt = jest
          .fn()
          .mockResolvedValueOnce('encrypted-file-content');

        const uploadedFile = await storageService.copyFileFromURLToBucket(
          escrowAddress,
          chainId,
          MOCK_FILE_URL,
        );

        expect(
          uploadedFile.url.includes(
            `http://${MOCK_S3_ENDPOINT}:${MOCK_S3_PORT}/${MOCK_S3_BUCKET}/`,
          ),
        ).toBeTruthy();
        expect(uploadedFile.hash).toBeDefined();
        expect(storageService.minioClient.putObject).toBeCalledWith(
          MOCK_S3_BUCKET,
          `s3${crypto
            .createHash('sha1')
            .update('some-file-content')
            .digest('hex')}.zip`,
          'some-file-content',
          { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' },
        );
      });
    });

    it('should handle an invalid URL', async () => {
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockRejectedValueOnce('Invalid URL');

      await expect(
        storageService.copyFileFromURLToBucket(
          escrowAddress,
          chainId,
          MOCK_FILE_URL,
        ),
      ).rejects.toThrow('File not uploaded');
    });
  });
});
