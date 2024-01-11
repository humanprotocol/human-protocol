import {
  ChainId,
  Encryption,
  EncryptionUtils,
  StakingClient,
  StorageClient,
} from '@human-protocol/sdk';
import { ConfigModule, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../../test/constants';
import { StorageService } from './storage.service';
import { Web3Service } from '../web3/web3.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  StakingClient: {
    build: jest.fn(),
  },
  StorageClient: {
    downloadFileFromUrl: jest.fn(),
  },
  Encryption: {
    build: jest.fn(),
  },
  EncryptionUtils: {
    encrypt: jest.fn(),
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
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);
  });

  describe('uploadJobSolutions', () => {
    it('should upload the solutions correctly', async () => {
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const escrowAddress = '0x1234567890123456789012345678901234567890';
      const chainId = ChainId.LOCALHOST;
      const solution = 'test';

      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValue(true);
      EncryptionUtils.encrypt = jest.fn().mockResolvedValue('encrypted');
      StakingClient.build = jest.fn().mockResolvedValue({
        getLeader: jest.fn().mockResolvedValue({
          publicKey: 'publicKey',
        }),
      });

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
      EncryptionUtils.encrypt = jest.fn().mockResolvedValue('encrypted');
      StakingClient.build = jest.fn().mockResolvedValue({
        getLeader: jest.fn().mockResolvedValue({}),
      });

      const jobSolution = {
        workerAddress,
        solution,
      };
      await expect(
        storageService.uploadJobSolutions(escrowAddress, chainId, [
          jobSolution,
        ]),
      ).rejects.toThrow('Missing public key');
    });
  });

  describe('downloadJobSolutions', () => {
    it('should download the file correctly', async () => {
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

      (Encryption.build as any).mockImplementation(() => ({
        decrypt: jest.fn().mockResolvedValue(JSON.stringify(expectedJobFile)),
      }));

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
