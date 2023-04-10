import crypto from 'crypto';
import * as Minio from 'minio';

import { UploadResult, Result, StorageCredentials } from './types';

/**
 * **Get S3 instance**
 *
 * @param {StorageCredentials} storageCredentials - Cloud storage access data
 * @returns {Minio.Client} - Minio Client instance
 */
const getS3Instance = (
  storageCredentials: StorageCredentials
): Minio.Client => {
  const storageClient = new Minio.Client({
    ...storageCredentials,
    accessKey: storageCredentials.accessKey,
    secretKey: storageCredentials.secretKey,
    endPoint: storageCredentials.endPoint,
  });

  return storageClient;
};

/**
 * **Upload result to cloud storage**
 *
 * @param {StorageCredentials} storageCredentials - Cloud storage access data
 * @param {Result[]} results - Results to upload
 * @returns {Promise<UploadResult>} - Uploaded result with key/hash
 */
export const uploadFiles = async (
  storageCredentials: StorageCredentials,
  files: Result[],
  bucket: string
): Promise<UploadResult[]> => {
  return Promise.all(
    files.map(async (file) => {
      const storageClient = getS3Instance(storageCredentials);

      const content = JSON.stringify(file);

      const hash = crypto.createHash('sha1').update(content).digest('hex');
      const key = `s3${hash}`;

      await storageClient.putObject(bucket, key, content, {
        'Content-Type': 'application/json',
      });

      return { key, hash };
    })
  );
};

//	bucketExists: boolean,
//	listObjects: string[],
