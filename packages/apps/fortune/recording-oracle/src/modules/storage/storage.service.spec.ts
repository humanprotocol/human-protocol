import { ChainId, StorageClient } from '@human-protocol/sdk';
import { ConfigModule, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
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

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  StorageClient: {
    downloadFileFromUrl: jest.fn(),
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

describe('Web3Service', () => {
  let storageService: StorageService;

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
      providers: [StorageService],
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

      const jobSolution = {
        workerAddress,
        solution,
      };
      const fileData = await storageService.uploadJobSolutions(
        escrowAddress,
        chainId,
        [jobSolution],
      );
      expect(fileData).toEqual({
        url: `http://${MOCK_S3_ENDPOINT}:${MOCK_S3_PORT}/${MOCK_S3_BUCKET}/${escrowAddress}-${chainId}.json`,
        hash: crypto
          .createHash('sha1')
          .update(JSON.stringify([jobSolution]))
          .digest('hex'),
      });
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        MOCK_S3_BUCKET,
        `${escrowAddress}-${chainId}.json`,
        expect.stringContaining(solution),
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
        .mockResolvedValue(expectedJobFile);
      const solutionsFile = await storageService.download(MOCK_FILE_URL);
      expect(solutionsFile).toBe(expectedJobFile);
    });

    it('should return empty array when file cannot be downloaded', async () => {
      StorageClient.downloadFileFromUrl = jest
        .fn()
        .mockRejectedValue('Network error');

      const solutionsFile = await storageService.download(MOCK_FILE_URL);
      expect(solutionsFile).toStrictEqual([]);
    });
  });
});
