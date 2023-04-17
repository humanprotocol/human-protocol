import crypto from 'crypto';
import * as Minio from 'minio';
import { DEFAULT_FILENAME_PREFIX } from './constants';
import {
  ErrorStorageBucketNotFound,
  ErrorStorageClientNotInitialized,
  ErrorStorageFileNotFound,
  ErrorStorageFileNotUploaded,
} from './error';
import {
  UploadResult,
  Result,
  StorageCredentials,
  StorageParams,
} from './types';

export default class StorageClient {
  private client: Minio.Client;

  /**
   * **Storage client constructor**
   *
   * @param {StorageCredentials} credentials - Cloud storage access data
   * @param {StorageParams} params - Cloud storage params
   */
  constructor(credentials: StorageCredentials, params: StorageParams) {
    try {
      this.client = new Minio.Client({
        ...params,
        accessKey: credentials.accessKey,
        secretKey: credentials.secretKey,
      });
    } catch (e) {
      throw ErrorStorageClientNotInitialized;
    }
  }

  /**
   * **Download files from cloud storage**
   *
   * @param {string} keys - Keys of files
   * @returns {Promise<Result>} - Downloaded result
   */
  public async downloadFiles(
    keys: string[],
    bucket: string
  ): Promise<Result[]> {
    const isBucketExists = await this.client.bucketExists(bucket);
    if (!isBucketExists) {
      throw ErrorStorageBucketNotFound;
    }

    return Promise.all(
      keys.map(async (key) => {
        try {
          const response = await this.client.getObject(bucket, key);
          console.log(3333, response);
          const content = response?.read();

          return { key, content: JSON.parse(content?.toString('utf-8') || '') };
        } catch (e) {
          console.log(e);
          throw ErrorStorageFileNotFound;
        }
      })
    );
  }

  /**
   * **Upload result to cloud storage**
   *
   * @param {Result[]} files - Files to upload
   * @param {string} bucket - Bucket name
   * @returns {Promise<UploadResult>} - Uploaded result with key/hash
   */
  public async uploadFiles(
    files: Result[],
    bucket: string
  ): Promise<UploadResult[]> {
    const isBucketExists = await this.client.bucketExists(bucket);
    if (!isBucketExists) {
      throw ErrorStorageBucketNotFound;
    }

    return Promise.all(
      files.map(async (file) => {
        const content = JSON.stringify(file);

        const hash = crypto.createHash('sha1').update(content).digest('hex');
        const key = `${DEFAULT_FILENAME_PREFIX}${hash}`;

        try {
          await this.client.putObject(bucket, key, content, {
            'Content-Type': 'application/json',
          });

          return { key, hash };
        } catch (e) {
          throw ErrorStorageFileNotUploaded;
        }
      })
    );
  }

  /**
   * **Checks if a bucket exists**
   *
   * @param {string} bucket - Name of the bucket
   * @returns {Promise<boolean>} - True if bucket exists, false otherwise
   */
  public async bucketExists(bucket: string): Promise<boolean> {
    return this.client.bucketExists(bucket);
  }

  /**
   * **Checks if a bucket exists**
   *
   * @param {string} bucket - Name of the bucket
   * @returns {Promise<string[]>} - A list of filenames with their extensions in the bucket
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

        stream.on('data', (obj) => keys.push(obj.name));
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
