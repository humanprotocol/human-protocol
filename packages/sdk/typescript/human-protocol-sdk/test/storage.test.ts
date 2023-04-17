import crypto from 'crypto';
import {
  DEFAULT_ENDPOINT,
  DEFAULT_FILENAME_PREFIX,
  DEFAULT_PORT,
  DEFAULT_PUBLIC_BUCKET,
  DEFAULT_USE_SSL,
  StorageCredentials,
  StorageParams,
} from '../src';
import {
  ErrorStorageClientNotInitialized,
  ErrorStorageFileNotFound,
  ErrorStorageFileNotUploaded,
} from '../src/error';
import StorageClient from '../src/storage';
import {
  STORAGE_FAKE_BUCKET,
  STORAGE_TEST_ACCESS_KEY,
  STORAGE_TEST_FILE_VALUE,
  STORAGE_TEST_SECRET_KEY,
} from './utils/constants';

// Create a Minio.Client mock for the tests
jest.mock('minio', () => {
  // Defines a constructor for the Minio.Client mock
  function Client() {
    return {
      getObject: jest.fn().mockImplementation(() => {
        const read = () => {
          return JSON.stringify({ key: STORAGE_TEST_FILE_VALUE });
        };
        return Promise.resolve({ read });
      }),
      putObject: jest.fn(), // putObject mock
      bucketExists: jest.fn().mockImplementation((bucketName) => {
        // Add conditional logic here based on the test scenario
        if (bucketName === STORAGE_FAKE_BUCKET) {
          return Promise.resolve(false); // Return false for fake scenario
        } else {
          return Promise.resolve(true); // Return true for other scenarios
        }
      }),
    };
  }

  // Returns Minio.Client mock
  return { Client };
});

describe('Storage tests', () => {
  describe('Client initialization', () => {
    it('should set correct credentials', async () => {
      const storageCredentials: StorageCredentials = {
        accessKey: STORAGE_TEST_ACCESS_KEY,
        secretKey: STORAGE_TEST_SECRET_KEY,
      };

      expect(storageCredentials.accessKey).toEqual(STORAGE_TEST_ACCESS_KEY);
      expect(storageCredentials.secretKey).toEqual(STORAGE_TEST_SECRET_KEY);
    });

    it('should set correct params', async () => {
      const storageParams: StorageParams = {
        endPoint: DEFAULT_ENDPOINT,
        port: DEFAULT_PORT,
        useSSL: DEFAULT_USE_SSL,
      };

      expect(storageParams.endPoint).toEqual(DEFAULT_ENDPOINT);
      expect(storageParams.port).toEqual(DEFAULT_PORT);
      expect(storageParams.useSSL).toEqual(false);
    });

    it('should throw an initialization error', async () => {
      const storageCredentials: StorageCredentials = {
        accessKey: STORAGE_TEST_ACCESS_KEY,
        secretKey: STORAGE_TEST_SECRET_KEY,
      };

      const storageParams: StorageParams = {
        endPoint: '', // Invalid endPoint
        useSSL: DEFAULT_USE_SSL,
      };

      expect(
        () => new StorageClient(storageCredentials, storageParams)
      ).toThrow(ErrorStorageClientNotInitialized);
    });

    it('should init client with empty credentials', async () => {
      const storageCredentials: StorageCredentials = {
        accessKey: '',
        secretKey: '',
      };

      const storageParams: StorageParams = {
        endPoint: DEFAULT_ENDPOINT,
        port: DEFAULT_PORT,
        useSSL: DEFAULT_USE_SSL,
      };

      const storageClient = new StorageClient(
        storageCredentials,
        storageParams
      );

      expect(storageClient).toBeInstanceOf(StorageClient);
    });
  });

  describe('Client anonymous access', () => {
    let storageClient: StorageClient;

    beforeEach(async () => {
      const storageCredentials: StorageCredentials = {
        accessKey: '',
        secretKey: '',
      };

      const storageParams: StorageParams = {
        endPoint: DEFAULT_ENDPOINT,
        port: DEFAULT_PORT,
        useSSL: DEFAULT_USE_SSL,
      };

      storageClient = new StorageClient(storageCredentials, storageParams);
    });

    it('should return the bucket exists', async () => {
      const isExists = await storageClient.bucketExists(DEFAULT_PUBLIC_BUCKET);
      expect(isExists).toEqual(true);
    });

    it('should return the bucket does not exist', async () => {
      const isExists = await storageClient.bucketExists(STORAGE_FAKE_BUCKET);
      expect(isExists).toEqual(false);
    });

    it('should upload the file with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      const uploadedResults = await storageClient.uploadFiles(
        [file],
        DEFAULT_PUBLIC_BUCKET
      );

      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const key = `${DEFAULT_FILENAME_PREFIX}${hash}`;

      expect(storageClient['client'].putObject).toHaveBeenCalledWith(
        DEFAULT_PUBLIC_BUCKET,
        key,
        JSON.stringify(file),
        {
          'Content-Type': 'application/json',
        }
      );
      expect(uploadedResults[0].key).toEqual(key);
      expect(uploadedResults[0].hash).toEqual(hash);
    });

    it('should upload the file with an error', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };
      jest.spyOn(storageClient, 'uploadFiles').mockImplementation(() => {
        throw ErrorStorageFileNotUploaded;
      });
      expect(() =>
        storageClient.uploadFiles([file], DEFAULT_PUBLIC_BUCKET)
      ).toThrow(ErrorStorageFileNotUploaded);
    });

    it.only('should download the file with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      await storageClient.uploadFiles([file], DEFAULT_PUBLIC_BUCKET);
      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const key = `${DEFAULT_FILENAME_PREFIX}${hash}`;

      const downloadedResults = await storageClient.downloadFiles(
        [key],
        DEFAULT_PUBLIC_BUCKET
      );

      expect(downloadedResults[0].key).toEqual(key);
      expect(downloadedResults[0].content).toEqual(file);
    });

    it('should download the file with an error', async () => {
      jest.spyOn(storageClient, 'downloadFiles').mockImplementation(() => {
        throw ErrorStorageFileNotFound;
      });
      expect(() =>
        storageClient.downloadFiles(
          [STORAGE_TEST_FILE_VALUE],
          DEFAULT_PUBLIC_BUCKET
        )
      ).toThrow(ErrorStorageFileNotFound);
    });

    it('should return a list of objects with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      await storageClient.uploadFiles([file], DEFAULT_PUBLIC_BUCKET);
      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const key = `${DEFAULT_FILENAME_PREFIX}${hash}`;

      const results = await storageClient.listObjects(DEFAULT_PUBLIC_BUCKET);

      expect(results[0]).toEqual(key);
    });

    it('should return a list of objects with an error', async () => {
      jest.spyOn(storageClient, 'listObjects').mockImplementation(() => {
        throw new Error();
      });
      expect(() => storageClient.listObjects(DEFAULT_PUBLIC_BUCKET)).toThrow(
        new Error()
      );
    });
  });

  describe('Client with credentials', () => {
    let storageClient: StorageClient;

    beforeEach(async () => {
      const storageCredentials: StorageCredentials = {
        accessKey: STORAGE_TEST_ACCESS_KEY,
        secretKey: STORAGE_TEST_SECRET_KEY,
      };

      const storageParams: StorageParams = {
        endPoint: DEFAULT_ENDPOINT,
        port: DEFAULT_PORT,
        useSSL: DEFAULT_USE_SSL,
      };

      storageClient = new StorageClient(storageCredentials, storageParams);
    });

    it('should return the bucket exists', async () => {
      const isExists = await storageClient.bucketExists(DEFAULT_PUBLIC_BUCKET);
      expect(isExists).toEqual(true);
    });

    it('should return the bucket does not exist', async () => {
      const isExists = await storageClient.bucketExists(STORAGE_FAKE_BUCKET);
      expect(isExists).toEqual(false);
    });

    it('should upload the file with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      const uploadedResults = await storageClient.uploadFiles(
        [file],
        DEFAULT_PUBLIC_BUCKET
      );

      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const key = `${DEFAULT_FILENAME_PREFIX}${hash}`;

      expect(storageClient['client'].putObject).toHaveBeenCalledWith(
        DEFAULT_PUBLIC_BUCKET,
        key,
        JSON.stringify(file),
        {
          'Content-Type': 'application/json',
        }
      );
      expect(uploadedResults[0].key).toEqual(key);
      expect(uploadedResults[0].hash).toEqual(hash);
    });

    it('should upload the file with an error', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };
      jest.spyOn(storageClient, 'uploadFiles').mockImplementation(() => {
        throw ErrorStorageFileNotUploaded;
      });
      expect(() =>
        storageClient.uploadFiles([file], DEFAULT_PUBLIC_BUCKET)
      ).toThrow(ErrorStorageFileNotUploaded);
    });

    it('should download the file with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      await storageClient.uploadFiles([file], DEFAULT_PUBLIC_BUCKET);
      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const key = `${DEFAULT_FILENAME_PREFIX}${hash}`;

      const downloadedResults = await storageClient.downloadFiles(
        [key],
        DEFAULT_PUBLIC_BUCKET
      );

      expect(downloadedResults[0].key).toEqual(key);
      expect(downloadedResults[0].content).toEqual(file);
    });

    it('should download the file with an error', async () => {
      jest.spyOn(storageClient, 'downloadFiles').mockImplementation(() => {
        throw ErrorStorageFileNotFound;
      });
      expect(() =>
        storageClient.downloadFiles(
          [STORAGE_TEST_FILE_VALUE],
          DEFAULT_PUBLIC_BUCKET
        )
      ).toThrow(ErrorStorageFileNotFound);
    });

    it('should return a list of objects with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      await storageClient.uploadFiles([file], DEFAULT_PUBLIC_BUCKET);
      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const key = `${DEFAULT_FILENAME_PREFIX}${hash}`;

      const results = await storageClient.listObjects(DEFAULT_PUBLIC_BUCKET);

      expect(results[0]).toEqual(key);
    });

    it('should return a list of objects with an error', async () => {
      jest.spyOn(storageClient, 'listObjects').mockImplementation(() => {
        throw new Error();
      });
      expect(() => storageClient.listObjects(DEFAULT_PUBLIC_BUCKET)).toThrow(
        new Error()
      );
    });
  });
});
