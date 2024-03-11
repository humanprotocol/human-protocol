import {
  ChainId,
  Encryption,
  EncryptionUtils,
  KVStoreClient,
  StorageClient,
  EscrowClient,
} from '@human-protocol/sdk';
import { ConfigModule, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../../test/constants';
import { StorageService } from './storage.service';
import { Web3Service } from '../web3/web3.service';
import { ConfigService } from '@nestjs/config';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  StorageClient: {
    downloadFileFromUrl: jest.fn(),
  },
  Encryption: {
    build: jest.fn(),
  },
  EncryptionUtils: {
    encrypt: jest.fn(),
  },
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      getPublicKey: jest.fn(),
    })),
  },
  EscrowClient: {
    build: jest.fn(),
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

describe('StorageService', () => {
  let storageService: StorageService;

  const signerMock = {
    address: '0x1234567890123456789012345678901234567892',
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const configServiceMock: Partial<ConfigService> = {
    get: jest.fn(),
  };

  beforeAll(async () => {
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
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);
  });

  describe('uploadJobSolutions', () => {
    beforeAll(async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      }));
    });

    it('should upload the solutions with encryption correctly', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValue(true);
      EncryptionUtils.encrypt = jest.fn().mockResolvedValue('encrypted');
      (KVStoreClient.build as jest.Mock).mockResolvedValue({
        getPublicKey: jest.fn().mockResolvedValue('publicKey'),
      });
      configServiceMock.get = jest.fn().mockReturnValueOnce(true);

      const jobSolution = {
        workerAddress,
        solution,
      };
      const fileUrl = await storageService.uploadJobSolutions(
        escrowAddress,
        chainId,
        [jobSolution],
      );
      expect(fileUrl).toBe(
        `http://${MOCK_S3_ENDPOINT}:${MOCK_S3_PORT}/${MOCK_S3_BUCKET}/${escrowAddress}-${chainId}.json`,
      );
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        MOCK_S3_BUCKET,
        `${escrowAddress}-${chainId}.json`,
        'encrypted',
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );
    });

    it('should upload the solutions without encryption correctly', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValue(true);
      configServiceMock.get = jest.fn().mockReturnValueOnce(true);

      const jobSolution = {
        workerAddress,
        solution,
      };
      const fileUrl = await storageService.uploadJobSolutions(
        escrowAddress,
        chainId,
        [jobSolution],
      );
      expect(fileUrl).toBe(
        `http://${MOCK_S3_ENDPOINT}:${MOCK_S3_PORT}/${MOCK_S3_BUCKET}/${escrowAddress}-${chainId}.json`,
      );
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        MOCK_S3_BUCKET,
        `${escrowAddress}-${chainId}.json`,
        'encrypted',
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );
    });

    it('should fail if the bucket does not exist', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValue(false);

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
        .mockResolvedValue(true);
      configServiceMock.get = jest.fn().mockReturnValueOnce(false);
      storageService.minioClient.putObject = jest
        .fn()
        .mockRejectedValue('Network error');

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

    it('should fail if public key is missing', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValue(true);
      configServiceMock.get = jest.fn().mockReturnValueOnce(true);
      EncryptionUtils.encrypt = jest.fn().mockResolvedValue('encrypted');
      (KVStoreClient.build as jest.Mock).mockResolvedValue({
        getPublicKey: jest.fn().mockResolvedValue(''),
      });

      const jobSolution = {
        workerAddress,
        solution,
      };
      await expect(
        storageService.uploadJobSolutions(escrowAddress, chainId, [
          jobSolution,
        ]),
      ).rejects.toThrow('Encryption error');
    });
  });

  describe('downloadJobSolutions', () => {
    it('should download the encrypted file correctly', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      const expectedJobFile = [
        {
          workerAddress,
          solution,
        },
      ];

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValue('encrypted-content');

      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(true);

      (Encryption.build as any).mockImplementation(() => ({
        decrypt: jest.fn().mockResolvedValue(JSON.stringify(expectedJobFile)),
      }));

      const solutionsFile = await storageService.downloadJobSolutions(
        escrowAddress,
        chainId,
      );
      expect(solutionsFile).toStrictEqual(expectedJobFile);
    });

    it('should download the non encrypted file correctly', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      const expectedJobFile = [
        {
          workerAddress,
          solution,
        },
      ];

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockResolvedValue(expectedJobFile);

      EncryptionUtils.isEncrypted = jest.fn().mockReturnValue(false);

      const solutionsFile = await storageService.downloadJobSolutions(
        escrowAddress,
        chainId,
      );
      expect(solutionsFile).toStrictEqual(expectedJobFile);
    });

    it('should return empty array when file cannot be downloaded', async () => {
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;

      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockRejectedValue('Network error');

      const solutionsFile = await storageService.downloadJobSolutions(
        escrowAddress,
        chainId,
      );
      expect(solutionsFile).toStrictEqual([]);
    });
  });
});
