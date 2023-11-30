import { StorageClient } from '@human-protocol/sdk';
import { ConfigModule, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_FILE_HASH,
  MOCK_FILE_URL,
  MOCK_MANIFEST,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
} from '../../../test/constants';
import { StorageService } from './storage.service';
import stringify from 'json-stable-stringify';
import { ErrorBucket } from '../../common/constants/errors';
import { hashString } from '../../common/utils';
import { ContentType } from '../../common/enums/storage';

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

jest.mock('axios');

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

  describe('uploadFile', () => {
    it('should upload the manifest correctly', async () => {
      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(true);

      const hash = hashString(stringify(MOCK_MANIFEST));

      const fileData = await storageService.uploadFile(MOCK_MANIFEST, hash);
      expect(fileData).toEqual({
        url: expect.any(String),
        hash: expect.any(String),
      });
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        MOCK_S3_BUCKET,
        expect.any(String),
        expect.any(String),
        {
          'Content-Type': ContentType.APPLICATION_JSON,
          'Cache-Control': 'no-store',
        },
      );
    });

    it('should fail if the bucket does not exist', async () => {
      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(false);

      await expect(
        storageService.uploadFile(MOCK_MANIFEST, MOCK_FILE_HASH),
      ).rejects.toThrow(ErrorBucket.NotExist);
    });

    it('should fail if the file cannot be uploaded', async () => {
      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(true);
      storageService.minioClient.putObject = jest
        .fn()
        .mockRejectedValueOnce('Network error');

      await expect(
        storageService.uploadFile(MOCK_MANIFEST, MOCK_FILE_HASH),
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
