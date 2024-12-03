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

import { Encryption, EncryptionUtils, HttpStatus } from '@human-protocol/sdk';
import { ConfigModule, ConfigService, registerAs } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import axios from 'axios';
import {
  MOCK_FILE_URL,
  MOCK_MANIFEST,
  MOCK_PGP_PRIVATE_KEY,
  MOCK_PGP_PUBLIC_KEY,
  MOCK_S3_ACCESS_KEY,
  MOCK_S3_BUCKET,
  MOCK_S3_ENDPOINT,
  MOCK_S3_PORT,
  MOCK_S3_SECRET_KEY,
  MOCK_S3_USE_SSL,
  mockConfig,
} from '../../../test/constants';
import { StorageService } from './storage.service';
import stringify from 'json-stable-stringify';
import { ErrorBucket } from '../../common/constants/errors';
import { hashString } from '../../common/utils';
import { ContentType } from '../../common/enums/storage';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { ControlledError } from '../../common/errors/controlled';
import {
  FileDownloadError,
  FileNotFoundError,
  InvalidFileUrl,
} from './storage.errors';

describe('StorageService', () => {
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
      providers: [
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
        StorageService,
        S3ConfigService,
        {
          provide: Encryption,
          useValue: await Encryption.build(MOCK_PGP_PRIVATE_KEY),
        },
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);
  });

  describe('downloadFileFromUrl', () => {
    it.each(['no-protocol.com', 'ftp://invalid-protocol.com'])(
      'throws if invalid URL [%#]',
      async (url) => {
        let thrownError;

        try {
          await StorageService.downloadFileFromUrl(url);
        } catch (error) {
          thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(InvalidFileUrl);
      },
    );

    it('throws if file not found', async () => {
      const testUrl = 'https://file-not.found';
      (axios.get as jest.Mock).mockImplementationOnce((url) => {
        if (url === testUrl) {
          return Promise.reject({
            response: {
              status: 404,
            },
          });
        }
        return Promise.resolve({});
      });

      let thrownError;
      try {
        await StorageService.downloadFileFromUrl(testUrl);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(FileNotFoundError);
      expect(thrownError.location).toBe(testUrl);
    });

    it('throws if netrowk error', async () => {
      const testUrl = 'https://network-error.io';
      const testError = new Error('ECONNRESET :443');
      (axios.get as jest.Mock).mockImplementationOnce((url) => {
        if (url === testUrl) {
          return Promise.reject({
            cause: testError,
          });
        }
        return Promise.resolve({ data: null });
      });

      let thrownError;
      try {
        await StorageService.downloadFileFromUrl(testUrl);
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(FileDownloadError);
      expect(thrownError.location).toBe(testUrl);
      expect(thrownError.cause).toBe(testError);
    });

    it('returns response as buffer', async () => {
      const testData = new Date().toISOString();
      const testDataBuffer = Buffer.from(testData);
      (axios.get as jest.Mock).mockImplementationOnce((_url, options) => {
        if (options.responseType === 'arraybuffer') {
          return Promise.resolve({
            data: testDataBuffer.buffer.slice(
              testDataBuffer.byteOffset,
              testDataBuffer.byteOffset + testDataBuffer.byteLength,
            ),
          });
        }

        return Promise.resolve({ data: {} });
      });

      const result = await StorageService.downloadFileFromUrl('http://test.io');
      expect(result.toString()).toBe(testData);
    });
  });

  describe('uploadJsonLikeData', () => {
    it('should upload the manifest correctly', async () => {
      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(true);

      const hash = hashString(stringify(MOCK_MANIFEST));

      const fileData = await storageService.uploadJsonLikeData(MOCK_MANIFEST);
      expect(fileData).toEqual({
        url: expect.stringContaining(`s3${hash}.json`),
        hash,
      });
      expect(storageService.minioClient.putObject).toHaveBeenCalledWith(
        'solution',
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
        storageService.uploadJsonLikeData(MOCK_MANIFEST),
      ).rejects.toThrow(
        new ControlledError(ErrorBucket.NotExist, HttpStatus.BAD_REQUEST),
      );
    });

    it('should fail if the file cannot be uploaded', async () => {
      storageService.minioClient.bucketExists = jest
        .fn()
        .mockResolvedValueOnce(true);
      storageService.minioClient.putObject = jest
        .fn()
        .mockRejectedValueOnce('Network error');

      await expect(
        storageService.uploadJsonLikeData(MOCK_MANIFEST),
      ).rejects.toThrow(
        new ControlledError('File not uploaded', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('downloadJsonLikeData', () => {
    const spyDownloadFileFromUrl = jest.spyOn(
      StorageService,
      'downloadFileFromUrl',
    );

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

      jest.spyOn(EncryptionUtils, 'isEncrypted').mockReturnValueOnce(false);
      spyDownloadFileFromUrl.mockResolvedValueOnce(
        Buffer.from(JSON.stringify(expectedJobFile)),
      );
      const solutionsFile =
        await storageService.downloadJsonLikeData(MOCK_FILE_URL);
      expect(solutionsFile).toStrictEqual(expectedJobFile);
      jest.spyOn(EncryptionUtils, 'isEncrypted').mockRestore();
    });

    it('should download the encrypted file correctly', async () => {
      const exchangeAddress = '0x1234567890123456789012345678901234567892';
      const workerAddress = '0x1234567890123456789012345678901234567891';
      const solution = 'test';

      const jobFile = {
        exchangeAddress,
        solutions: [
          {
            workerAddress,
            solution,
          },
        ],
      };

      const encryption = await Encryption.build(MOCK_PGP_PRIVATE_KEY);
      const encryptedJobFile = await encryption.signAndEncrypt(
        JSON.stringify(jobFile),
        [MOCK_PGP_PUBLIC_KEY],
      );
      spyDownloadFileFromUrl.mockResolvedValueOnce(
        Buffer.from(encryptedJobFile),
      );

      const solutionsFile =
        await storageService.downloadJsonLikeData(MOCK_FILE_URL);
      expect(solutionsFile).toStrictEqual(jobFile);
    });

    it('should return empty array when file cannot be downloaded', async () => {
      spyDownloadFileFromUrl.mockRejectedValue('Network error');

      const solutionsFile =
        await storageService.downloadJsonLikeData(MOCK_FILE_URL);
      expect(solutionsFile).toStrictEqual([]);
    });
  });
});
