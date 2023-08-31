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
   * **Download files from cloud storage**
   *
   * @param {string} keys - Keys of files
   * @returns {Promise<File>} - Downloaded file
   */
  public async downloadFiles(keys: string[], bucket: string): Promise<any[]> {
    const isBucketExists = await this.client.bucketExists(bucket);
    if (!isBucketExists) {
      throw ErrorStorageBucketNotFound;
    }

    console.log(keys);
    return Promise.all(
      keys.map(async (key) => {
        try {
          const response = await this.client.getObject(bucket, key);
          console.log(response);
          if (response) {
            let content = response.read();

            if (key.endsWith('.json')) {
              content = JSON.parse(content.toString('utf-8'));
            }

            return { key, content };
          } else {
            throw ErrorStorageFileNotFound;
          }
        } catch (e) {
          throw ErrorStorageFileNotFound;
        }
      })
    );
  }

  /**
   * **Download files from cloud storage.*
   *
   * @param {string} url - URL to the file
   * @returns {Promise<File>} - Downloaded file
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
   * **Upload files to cloud storage**
   *
   * @param {any[]} files - Files to upload (can be Blob, text content, or binary content)
   * @param {string} bucket - Bucket name
   * @returns {Promise<UploadFile>} - Uploaded files with keys/hashes
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
        let content;
        let contentType;
        if (file instanceof Blob) {
          // For binary files
          content = await file.arrayBuffer();
          contentType = file.type;
          content = Buffer.from(content);
        } else {
          // For text or other content
          content = JSON.stringify(file);
          contentType = 'application/json';
        }

        const hash = crypto.createHash('sha1').update(content).digest('hex');
        const extension = file instanceof Blob ? 'bin' : 'json';
        const key = `s3${hash}.${extension}`;

        try {
          await this.client.putObject(bucket, key, content, {
            'Content-Type': contentType,
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
