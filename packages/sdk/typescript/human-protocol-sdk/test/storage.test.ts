import { describe, test, expect, vi, beforeAll } from 'vitest';
import axios from 'axios';
import crypto from 'crypto';
import {
  DEFAULT_ENDPOINT,
  DEFAULT_PORT,
  DEFAULT_PUBLIC_BUCKET,
  DEFAULT_REGION,
  DEFAULT_USE_SSL,
  HttpStatus,
  StorageCredentials,
  StorageParams,
} from '../src';
import {
  ErrorInvalidUrl,
  ErrorStorageFileNotFound,
  ErrorStorageFileNotUploaded,
} from '../src/error';
import { StorageClient } from '../src/storage';
import {
  FAKE_URL,
  STORAGE_FAKE_BUCKET,
  STORAGE_TEST_ACCESS_KEY,
  STORAGE_TEST_FILE_VALUE,
  STORAGE_TEST_FILE_VALUE_2,
  STORAGE_TEST_SECRET_KEY,
} from './utils/constants';

// Create a Minio.Client mock for the tests
vi.mock('minio', () => {
  // Define a constructor for the Minio.Client mock
  class Client {
    getObject = vi.fn().mockImplementation(() => {
      const read = () => {
        return JSON.stringify({ key: STORAGE_TEST_FILE_VALUE });
      };
      return Promise.resolve({ read });
    }); // getObject mock
    putObject = vi.fn(); // putObject mock
    bucketExists = vi.fn().mockImplementation((bucketName) => {
      // Add conditional logic here based on the test scenario
      if (bucketName === STORAGE_FAKE_BUCKET) {
        return Promise.resolve(false); // Return false for fake scenario
      } else {
        return Promise.resolve(true); // Return true for other scenarios
      }
    });
  }

  // Return Minio.Client mock
  return { Client };
});

vi.mock('axios');

describe('Storage tests', () => {
  describe('Client initialization', () => {
    test('should set correct credentials', async () => {
      const storageCredentials: StorageCredentials = {
        accessKey: STORAGE_TEST_ACCESS_KEY,
        secretKey: STORAGE_TEST_SECRET_KEY,
      };

      expect(storageCredentials.accessKey).toEqual(STORAGE_TEST_ACCESS_KEY);
      expect(storageCredentials.secretKey).toEqual(STORAGE_TEST_SECRET_KEY);
    });

    test('should set correct params', async () => {
      const storageParams: StorageParams = {
        endPoint: DEFAULT_ENDPOINT,
        port: DEFAULT_PORT,
        useSSL: DEFAULT_USE_SSL,
        region: DEFAULT_REGION,
      };

      expect(storageParams.endPoint).toEqual(DEFAULT_ENDPOINT);
      expect(storageParams.port).toEqual(DEFAULT_PORT);
      expect(storageParams.useSSL).toEqual(false);
      expect(storageParams.region).toEqual(DEFAULT_REGION);
    });

    test('should init client with empty credentials', async () => {
      const storageParams: StorageParams = {
        endPoint: DEFAULT_ENDPOINT,
        port: DEFAULT_PORT,
        useSSL: DEFAULT_USE_SSL,
      };

      const storageClient = new StorageClient(storageParams);

      expect(storageClient).toBeInstanceOf(StorageClient);
    });
  });

  describe('Client anonymous access', () => {
    let storageClient: StorageClient;

    beforeAll(async () => {
      const storageParams: StorageParams = {
        endPoint: DEFAULT_ENDPOINT,
        port: DEFAULT_PORT,
        useSSL: DEFAULT_USE_SSL,
      };

      storageClient = new StorageClient(storageParams);
    });

    test('should return the bucket exists', async () => {
      const isExists = await storageClient.bucketExists(DEFAULT_PUBLIC_BUCKET);
      expect(isExists).toEqual(true);
    });

    test('should return the bucket does not exist', async () => {
      const isExists = await storageClient.bucketExists(STORAGE_FAKE_BUCKET);
      expect(isExists).toEqual(false);
    });

    test('should upload the file with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      const uploadedResults = await storageClient.uploadFiles(
        [file],
        DEFAULT_PUBLIC_BUCKET
      );

      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const key = `s3${hash}.json`;

      expect(storageClient['client'].putObject).toHaveBeenCalledWith(
        DEFAULT_PUBLIC_BUCKET,
        key,
        JSON.stringify(file),
        undefined,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        }
      );
      expect(uploadedResults[0].key).toEqual(key);
      expect(uploadedResults[0].url).toEqual(
        `http://${DEFAULT_ENDPOINT}:${DEFAULT_PORT}/${DEFAULT_PUBLIC_BUCKET}/${key}`
      );
      expect(uploadedResults[0].hash).toEqual(hash);
    });

    test('should not upload the file with an error', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };
      vi.spyOn(storageClient, 'uploadFiles').mockImplementation(() => {
        throw ErrorStorageFileNotUploaded;
      });
      expect(() =>
        storageClient.uploadFiles([file], DEFAULT_PUBLIC_BUCKET)
      ).toThrow(ErrorStorageFileNotUploaded);
    });

    test('should download the files with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const key = `s3${hash}.json`;

      const downloadedResults = await storageClient.downloadFiles(
        [key],
        DEFAULT_PUBLIC_BUCKET
      );

      expect(storageClient['client'].getObject).toHaveBeenCalledWith(
        DEFAULT_PUBLIC_BUCKET,
        key
      );
      expect(downloadedResults[0].key).toEqual(key);
      expect(downloadedResults[0].content).toEqual(file);
    });

    test('should not download the files with an error', async () => {
      vi.spyOn(storageClient, 'downloadFiles').mockImplementation(() => {
        throw ErrorStorageFileNotFound;
      });
      expect(() =>
        storageClient.downloadFiles(
          [STORAGE_TEST_FILE_VALUE],
          DEFAULT_PUBLIC_BUCKET
        )
      ).toThrow(ErrorStorageFileNotFound);
    });

    test('should fail URL validation', async () => {
      expect(StorageClient.downloadFileFromUrl(FAKE_URL)).rejects.toThrow(
        ErrorInvalidUrl
      );
    });

    test('should download the file from URL with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      vi.spyOn(axios, 'get').mockImplementation(() =>
        Promise.resolve({ data: file, status: HttpStatus.OK })
      );

      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const url = `http://${DEFAULT_PUBLIC_BUCKET}/${hash}.json`;

      const result = await StorageClient.downloadFileFromUrl(url);
      expect(result).toEqual(file);
    });

    test('should not download the file from URL with an error', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const url = `http://${DEFAULT_PUBLIC_BUCKET}/${hash}.json`;

      vi.spyOn(StorageClient, 'downloadFileFromUrl').mockImplementation(() => {
        throw ErrorStorageFileNotFound;
      });
      expect(() => StorageClient.downloadFileFromUrl(url)).toThrow(
        ErrorStorageFileNotFound
      );
    });

    test('should return a list of objects with success', async () => {
      const file1 = { key: STORAGE_TEST_FILE_VALUE };
      const hash1 = crypto
        .createHash('sha1')
        .update(JSON.stringify(file1))
        .digest('hex');
      const key1 = `s3${hash1}.json`;

      const file2 = { key: STORAGE_TEST_FILE_VALUE_2 };
      const hash2 = crypto
        .createHash('sha1')
        .update(JSON.stringify(file2))
        .digest('hex');
      const key2 = `s3${hash2}.json`;

      vi.spyOn(storageClient, 'listObjects').mockImplementation(() =>
        Promise.resolve([key1, key2])
      );

      const results = await storageClient.listObjects(DEFAULT_PUBLIC_BUCKET);

      expect(results[0]).toEqual(key1);
      expect(results[1]).toEqual(key2);
    });

    test('should not return a list of objects with an error', async () => {
      vi.spyOn(storageClient, 'listObjects').mockImplementation(() => {
        throw new Error();
      });
      expect(() => storageClient.listObjects(DEFAULT_PUBLIC_BUCKET)).toThrow(
        new Error()
      );
    });
  });

  describe('Client with credentials', () => {
    let storageClient: StorageClient;

    beforeAll(async () => {
      const storageCredentials: StorageCredentials = {
        accessKey: STORAGE_TEST_ACCESS_KEY,
        secretKey: STORAGE_TEST_SECRET_KEY,
      };

      const storageParams: StorageParams = {
        endPoint: DEFAULT_ENDPOINT,
        port: DEFAULT_PORT,
        useSSL: DEFAULT_USE_SSL,
      };

      storageClient = new StorageClient(storageParams, storageCredentials);
    });

    test('should return the bucket exists', async () => {
      const isExists = await storageClient.bucketExists(DEFAULT_PUBLIC_BUCKET);
      expect(isExists).toEqual(true);
    });

    test('should return the bucket does not exist', async () => {
      const isExists = await storageClient.bucketExists(STORAGE_FAKE_BUCKET);
      expect(isExists).toEqual(false);
    });

    test('should upload the file with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      const uploadedResults = await storageClient.uploadFiles(
        [file],
        DEFAULT_PUBLIC_BUCKET
      );

      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const key = `s3${hash}.json`;

      expect(storageClient['client'].putObject).toHaveBeenCalledWith(
        DEFAULT_PUBLIC_BUCKET,
        key,
        JSON.stringify(file),
        undefined,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        }
      );
      expect(uploadedResults[0].key).toEqual(key);
      expect(uploadedResults[0].url).toEqual(
        `http://${DEFAULT_ENDPOINT}:${DEFAULT_PORT}/${DEFAULT_PUBLIC_BUCKET}/${key}`
      );
      expect(uploadedResults[0].hash).toEqual(hash);
    });

    test('should not upload the file with an error', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };
      vi.spyOn(storageClient, 'uploadFiles').mockImplementation(() => {
        throw ErrorStorageFileNotUploaded;
      });
      expect(() =>
        storageClient.uploadFiles([file], DEFAULT_PUBLIC_BUCKET)
      ).toThrow(ErrorStorageFileNotUploaded);
    });

    test('should download the file with success', async () => {
      const file = { key: STORAGE_TEST_FILE_VALUE };

      const hash = crypto
        .createHash('sha1')
        .update(JSON.stringify(file))
        .digest('hex');
      const key = `s3${hash}.json`;

      const downloadedResults = await storageClient.downloadFiles(
        [key],
        DEFAULT_PUBLIC_BUCKET
      );

      expect(storageClient['client'].getObject).toHaveBeenCalledWith(
        DEFAULT_PUBLIC_BUCKET,
        key
      );
      expect(downloadedResults[0].key).toEqual(key);
      expect(downloadedResults[0].content).toEqual(file);
    });

    test('should not download the file with an error', async () => {
      vi.spyOn(storageClient, 'downloadFiles').mockImplementation(() => {
        throw ErrorStorageFileNotFound;
      });
      expect(() =>
        storageClient.downloadFiles(
          [STORAGE_TEST_FILE_VALUE],
          DEFAULT_PUBLIC_BUCKET
        )
      ).toThrow(ErrorStorageFileNotFound);
    });

    test('should return a list of objects with success', async () => {
      const file1 = { key: STORAGE_TEST_FILE_VALUE };
      const hash1 = crypto
        .createHash('sha1')
        .update(JSON.stringify(file1))
        .digest('hex');
      const key1 = `s3${hash1}.json`;

      const file2 = { key: STORAGE_TEST_FILE_VALUE_2 };
      const hash2 = crypto
        .createHash('sha1')
        .update(JSON.stringify(file2))
        .digest('hex');
      const key2 = `s3${hash2}.json`;

      vi.spyOn(storageClient, 'listObjects').mockImplementation(() =>
        Promise.resolve([key1, key2])
      );

      const results = await storageClient.listObjects(DEFAULT_PUBLIC_BUCKET);

      expect(results[0]).toEqual(key1);
      expect(results[1]).toEqual(key2);
    });

    test('should not return a list of objects with an error', async () => {
      vi.spyOn(storageClient, 'listObjects').mockImplementation(() => {
        throw new Error();
      });
      expect(() => storageClient.listObjects(DEFAULT_PUBLIC_BUCKET)).toThrow(
        new Error()
      );
    });
  });
});
