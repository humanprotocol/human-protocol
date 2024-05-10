/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import crypto from 'crypto';
import * as Minio from 'minio';
import {
  ErrorInvalidUrl,
  ErrorStorageBucketNotFound,
  ErrorStorageClientNotInitialized,
  ErrorStorageFileNotFound,
  ErrorStorageFileNotUploaded,
} from './error';
import { UploadFile, StorageCredentials, StorageParams } from './types';
import { isValidUrl } from './utils';
import { HttpStatus } from './constants';

/**
 *
 * @deprecated StorageClient is deprecated. Use Minio.Client directly.
 *
 * ## Introduction
 *
 * This client enables to interact with S3 cloud storage services like Amazon S3 Bucket, Google Cloud Storage and others.
 *
 * The instance creation of `StorageClient` should be made using its constructor:
 *
 * ```ts
 * constructor(params: StorageParams, credentials?: StorageCredentials)
 * ```
 *
 * > If credentials is not provided, it uses an anonymous access to the bucket for downloading files.
 *
 * ## Installation
 *
 * ### npm
 * ```bash
 * npm install @human-protocol/sdk
 * ```
 *
 * ### yarn
 * ```bash
 * yarn install @human-protocol/sdk
 * ```
 *
 * ## Code example
 *
 * ```ts
 * import { StorageClient, StorageCredentials, StorageParams } from '@human-protocol/sdk';
 *
 * const credentials: StorageCredentials = {
 *   accessKey: 'ACCESS_KEY',
 *   secretKey: 'SECRET_KEY',
 * };
 * const params: StorageParams = {
 *   endPoint: 'http://localhost',
 *   port: 9000,
 *   useSSL: false,
 *   region: 'us-east-1'
 * };
 *
 * const storageClient = new StorageClient(params, credentials);
 * ```
 */
export class StorageClient {
  private client: Minio.Client;
  private clientParams: StorageParams;

  /**
   * **Storage client constructor**
   *
   * @param {StorageParams} params - Cloud storage params
   * @param {StorageCredentials} credentials - Optional. Cloud storage access data. If credentials is not provided - use an anonymous access to the bucket
   */
  constructor(params: StorageParams, credentials?: StorageCredentials) {
    try {
      this.clientParams = params;

      this.client = new Minio.Client({
        ...params,
        accessKey: credentials?.accessKey ?? '',
        secretKey: credentials?.secretKey ?? '',
      });
    } catch (e) {
      throw ErrorStorageClientNotInitialized;
    }
  }

  /**
   * This function downloads files from a bucket.
   *
   * @param {string[]} keys Array of filenames to download.
   * @param {string} bucket Bucket name.
   * @returns {any[]} Returns an array of json files downloaded and parsed into objects.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { StorageClient, StorageCredentials, StorageParams } from '@human-protocol/sdk';
   *
   * const params: StorageParams = {
   *   endPoint: 'http://localhost',
   *   port: 9000,
   *   useSSL: false,
   *   region: 'us-east-1'
   * };
   *
   * const storageClient = new StorageClient(params);
   *
   * const keys = ['file1.json', 'file2.json'];
   * const files = await storageClient.downloadFiles(keys, 'bucket-name');
   * ```
   */
  public async downloadFiles(keys: string[], bucket: string): Promise<any[]> {
    const isBucketExists = await this.client.bucketExists(bucket);
    if (!isBucketExists) {
      throw ErrorStorageBucketNotFound;
    }

    return Promise.all(
      keys.map(async (key) => {
        try {
          const response = await this.client.getObject(bucket, key);
          const content = response?.read();

          return { key, content: JSON.parse(content?.toString('utf-8') || '') };
        } catch (e) {
          throw ErrorStorageFileNotFound;
        }
      })
    );
  }

  /**
   * This function downloads files from a Url.
   *
   * @param {string} url Url of the file to download.
   * @returns {any} Returns the JSON file downloaded and parsed into object.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { StorageClient } from '@human-protocol/sdk';
   *
   * const file = await storageClient.downloadFileFromUrl('http://localhost/file.json');
   * ```
   */
  public static async downloadFileFromUrl(url: string): Promise<any> {
    if (!isValidUrl(url)) {
      throw ErrorInvalidUrl;
    }

    try {
      const { data, status } = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (status !== HttpStatus.OK) {
        throw ErrorStorageFileNotFound;
      }

      return data;
    } catch (e) {
      throw ErrorStorageFileNotFound;
    }
  }

  /**
   * This function uploads files to a bucket.
   *
   * @param {any[]} files Array of objects to upload serialized into json.
   * @param {string} bucket Bucket name.
   * @returns {UploadFile[]} Returns an array of json files downloaded and parsed into objects.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { StorageClient, StorageCredentials, StorageParams } from '@human-protocol/sdk';
   *
   * const credentials: StorageCredentials = {
   *   accessKey: 'ACCESS_KEY',
   *   secretKey: 'SECRET_KEY',
   * };
   * const params: StorageParams = {
   *   endPoint: 'http://localhost',
   *   port: 9000,
   *   useSSL: false,
   *   region: 'us-east-1'
   * };
   *
   * const storageClient = new StorageClient(params, credentials);
   * const file1 = { name: 'file1', description: 'description of file1' };
   * const file2 = { name: 'file2', description: 'description of file2' };
   * const files = [file1, file2];
   * const uploadedFiles = await storageClient.uploadFiles(files, 'bucket-name');
   * ```
   */
  public async uploadFiles(
    files: any[],
    bucket: string
  ): Promise<UploadFile[]> {
    const isBucketExists = await this.client.bucketExists(bucket);
    if (!isBucketExists) {
      throw ErrorStorageBucketNotFound;
    }

    return Promise.all(
      files.map(async (file) => {
        const content = JSON.stringify(file);

        const hash = crypto.createHash('sha1').update(content).digest('hex');
        const key = `s3${hash}.json`;

        try {
          await this.client.putObject(bucket, key, content, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          });

          return {
            key,
            url: `${this.clientParams.useSSL ? 'https' : 'http'}://${
              this.clientParams.endPoint
            }${
              this.clientParams.port ? `:${this.clientParams.port}` : ''
            }/${bucket}/${key}`,
            hash,
          };
        } catch (e) {
          throw ErrorStorageFileNotUploaded;
        }
      })
    );
  }

  /**
   * This function checks if a bucket exists.
   *
   * @param {string} bucket Bucket name.
   * @returns {boolean} Returns `true` if exists, `false` if it doesn't.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { StorageClient, StorageCredentials, StorageParams } from '@human-protocol/sdk';
   *
   * const credentials: StorageCredentials = {
   *   accessKey: 'ACCESS_KEY',
   *   secretKey: 'SECRET_KEY',
   * };
   * const params: StorageParams = {
   *   endPoint: 'http://localhost',
   *   port: 9000,
   *   useSSL: false,
   *   region: 'us-east-1'
   * };
   *
   * const storageClient = new StorageClient(params, credentials);
   * const exists = await storageClient.bucketExists('bucket-name');
   * ```
   */
  public async bucketExists(bucket: string): Promise<boolean> {
    return this.client.bucketExists(bucket);
  }

  /**
   * This function list all file names contained in the bucket.
   *
   * @param {string} bucket Bucket name.
   * @returns {boolean} Returns the list of file names contained in the bucket.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { StorageClient, StorageCredentials, StorageParams } from '@human-protocol/sdk';
   *
   * const credentials: StorageCredentials = {
   *   accessKey: 'ACCESS_KEY',
   *   secretKey: 'SECRET_KEY',
   * };
   * const params: StorageParams = {
   *   endPoint: 'http://localhost',
   *   port: 9000,
   *   useSSL: false,
   *   region: 'us-east-1'
   * };
   *
   * const storageClient = new StorageClient(params, credentials);
   * const fileNames = await storageClient.listObjects('bucket-name');
   * ```
   */
  public async listObjects(bucket: string): Promise<string[]> {
    const isBucketExists = await this.client.bucketExists(bucket);
    if (!isBucketExists) {
      throw ErrorStorageBucketNotFound;
    }

    try {
      return new Promise((resolve, reject) => {
        const keys: string[] = [];
        const stream = this.client.listObjectsV2(bucket, '', true, '');

        stream.on('data', (obj: { name: string }) => keys.push(obj.name));
        stream.on('error', reject);
        stream.on('end', () => {
          resolve(keys);
        });
      });
    } catch (e) {
      throw new Error(String(e));
    }
  }
}
