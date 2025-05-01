jest.mock('minio');

import { createMock } from '@golevelup/ts-jest';
import { faker } from '@faker-js/faker';
import { Test } from '@nestjs/testing';
import { Client as MinioClient } from 'minio';

import { ContentType } from '../../common/enums';
import { S3ConfigService } from '../../config/s3-config.service';
import * as httpUtils from '../../utils/http';

import { PgpEncryptionService } from '../encryption/pgp-encryption.service';

import { MinioErrorCodes } from './minio.constants';
import { StorageService } from './storage.service';

const mockedMinioClientInstance = {
  statObject: jest.fn(),
  bucketExists: jest.fn(),
  putObject: jest.fn(),
};
jest
  .mocked(MinioClient)
  .mockImplementation(
    () => mockedMinioClientInstance as unknown as MinioClient,
  );

const mockedPgpEncryptionService = createMock<PgpEncryptionService>();

const mockS3ConfigService: Omit<S3ConfigService, 'configService'> = {
  endpoint: faker.internet.domainName(),
  port: faker.internet.port(),
  accessKey: faker.internet.password(),
  secretKey: faker.internet.password(),
  bucket: faker.lorem.word(),
  useSSL: true,
};

function constructExpectedS3FileUrl(fileName: string) {
  return (
    'https://' +
    `${mockS3ConfigService.endpoint}:${mockS3ConfigService.port}/` +
    `${mockS3ConfigService.bucket}/${fileName}`
  );
}

describe('StorageService', () => {
  let storageService: StorageService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: S3ConfigService,
          useValue: mockS3ConfigService,
        },
        StorageService,
        {
          provide: PgpEncryptionService,
          useValue: mockedPgpEncryptionService,
        },
      ],
    }).compile();

    storageService = moduleRef.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('uploadData', () => {
    it('should throw if configured bucket does not exist', async () => {
      mockedMinioClientInstance.bucketExists.mockImplementation(
        (bucketName) => {
          if (bucketName === mockS3ConfigService.bucket) {
            return false;
          }

          return true;
        },
      );

      await expect(
        storageService.uploadData(
          faker.string.sample(),
          faker.system.fileName(),
          ContentType.PLAIN_TEXT,
        ),
      ).rejects.toThrow("Can't find configured bucket");

      expect(mockedMinioClientInstance.putObject).toHaveBeenCalledTimes(0);
    });

    it('should not upload if file already exists', async () => {
      mockedMinioClientInstance.bucketExists.mockResolvedValueOnce(true);

      const fileName = `${faker.lorem.word()}.json`;
      mockedMinioClientInstance.statObject.mockImplementation(
        (bucketName, key) => {
          if (bucketName === mockS3ConfigService.bucket && key === fileName) {
            return {};
          }

          throw {
            code: MinioErrorCodes.NotFound,
          };
        },
      );

      const fileUrl = await storageService.uploadData(
        JSON.stringify({ test: faker.string.sample() }),
        fileName,
        ContentType.JSON,
      );
      expect(fileUrl).toBe(constructExpectedS3FileUrl(fileName));
      expect(mockedMinioClientInstance.putObject).toHaveBeenCalledTimes(0);
    });

    it('should upload if file does not exists', async () => {
      mockedMinioClientInstance.bucketExists.mockResolvedValueOnce(true);

      const fileName = faker.system.fileName();
      mockedMinioClientInstance.statObject.mockRejectedValue({
        code: MinioErrorCodes.NotFound,
      });
      const fileContent = Buffer.from(faker.string.sample());
      const contentType = ContentType.BINARY;

      const fileUrl = await storageService.uploadData(
        fileContent,
        fileName,
        contentType,
      );
      expect(fileUrl).toBe(constructExpectedS3FileUrl(fileName));
      expect(mockedMinioClientInstance.putObject).toHaveBeenCalledTimes(1);
      expect(mockedMinioClientInstance.putObject).toHaveBeenCalledWith(
        mockS3ConfigService.bucket,
        fileName,
        fileContent,
        {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      );
    });
  });

  describe('downloadFile', () => {
    const EXPECTED_DOWNLOAD_ERROR_MESSAGE = 'Error downloading file';
    let spyOnDownloadFile: jest.SpyInstance;

    beforeAll(() => {
      spyOnDownloadFile = jest.spyOn(httpUtils, 'downloadFile');
      spyOnDownloadFile.mockImplementation();
    });

    afterAll(() => {
      spyOnDownloadFile.mockRestore();
    });

    it('should throw custom error when fails to load file', async () => {
      spyOnDownloadFile.mockRejectedValueOnce(new Error(faker.lorem.word()));

      await expect(
        storageService.downloadFile(faker.internet.url()),
      ).rejects.toThrow(EXPECTED_DOWNLOAD_ERROR_MESSAGE);
    });

    it('should throw custom error when fails to decrypt', async () => {
      spyOnDownloadFile.mockResolvedValueOnce(Buffer.from(''));
      mockedPgpEncryptionService.maybeDecryptFile.mockRejectedValueOnce(
        new Error(faker.lorem.word()),
      );

      await expect(
        storageService.downloadFile(faker.internet.url()),
      ).rejects.toThrow(EXPECTED_DOWNLOAD_ERROR_MESSAGE);
    });

    it('should download file', async () => {
      const data = {
        string: faker.string.sample(),
        number: faker.number.float(),
        bool: false,
        null: null,
      };

      const fileUrl = faker.internet.url();
      spyOnDownloadFile.mockImplementation(async (url) => {
        if (url === fileUrl) {
          return Buffer.from(JSON.stringify(data));
        }

        throw new Error('File not found');
      });
      mockedPgpEncryptionService.maybeDecryptFile.mockImplementationOnce(
        async (c) => c,
      );

      const downloadedFile = await storageService.downloadFile(fileUrl);
      const content = JSON.parse(downloadedFile.toString());

      expect(content).toEqual(data);
    });
  });

  describe('downloadJsonLikeData', () => {
    const EXPECTED_DOWNLOAD_ERROR_MESSAGE = 'Error downloading json like data';
    let spyOnDownloadFile: jest.SpyInstance;

    beforeAll(() => {
      spyOnDownloadFile = jest.spyOn(storageService, 'downloadFile');
      spyOnDownloadFile.mockImplementation();
    });

    afterAll(() => {
      spyOnDownloadFile.mockRestore();
    });

    it('should throw custom error when fails to load file', async () => {
      spyOnDownloadFile.mockRejectedValueOnce(new Error(faker.lorem.word()));

      await expect(
        storageService.downloadJsonLikeData(faker.internet.url()),
      ).rejects.toThrow(EXPECTED_DOWNLOAD_ERROR_MESSAGE);
    });

    it('should download json like data', async () => {
      const data = {
        string: faker.string.sample(),
        number: faker.number.float(),
        bool: false,
        null: null,
      };

      const fileUrl = faker.internet.url();
      spyOnDownloadFile.mockImplementation(async (url) => {
        if (url === fileUrl) {
          return Buffer.from(JSON.stringify(data));
        }

        throw new Error('File not found');
      });

      const downloadedData = await storageService.downloadJsonLikeData(fileUrl);

      expect(downloadedData).toEqual(data);
    });
  });
});
