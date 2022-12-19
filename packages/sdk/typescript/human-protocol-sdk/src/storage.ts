import AWS from 'aws-sdk';
import crypto from 'crypto';

import { UploadResult, StorageAccessData, Result } from './types';

/**
 * **Get S3 instance**
 *
 * @param {StorageAccessData} storageAccessData - Cloud storage access data
 * @returns {AWS.S3} - AWS S3 instance
 */
const getS3Instance = (storageAccessData: StorageAccessData): AWS.S3 => {
  AWS.config.update({
    accessKeyId: storageAccessData.accessKeyId,
    secretAccessKey: storageAccessData.secretAccessKey,
  });

  const s3 = new AWS.S3({
    endpoint: storageAccessData.endpoint,
    region: storageAccessData.region,
  });

  return s3;
};

/**
 * **Get bucket name**
 *
 * @param {StorageAccessData} storageAccessData - Cloud storage access data
 * @param {boolean} isPublic - Whether to return public bucket, or private bucket.
 * @returns {string} - Bucket name
 */
const getBucket = (
  storageAccessData: StorageAccessData,
  isPublic: boolean
): string => {
  return isPublic ? storageAccessData.publicBucket : storageAccessData.bucket;
};

/**
 * **Get public URL of the object**
 *
 * @param {StorageAccessData} storageAccessData - Cloud storage access data
 * @param {string} key - Key of the object
 * @returns {string} - The public URL of the object
 */
export const getPublicURL = (
  storageAccessData: StorageAccessData,
  key: string
): string => {
  return `https://${storageAccessData.publicBucket}.s3.amazonaws.com/${key}`;
};

/**
 * **Parse object key from URL**
 *
 * @param {string} url - URL to parse
 * @returns {string} - The key of the object
 */
export const getKeyFromURL = (url: string): string => {
  if (url.startsWith('https')) {
    // URL is fully qualified URL. Let's split it and try to retrieve key from last part of it.
    const keyParts = url.split('/');
    const key = keyParts[keyParts.length - 1];

    return key;
  }

  // If not fully qualified http URL, the key is the URL
  return url;
};

/**
 * **Download result from cloud storage**
 *
 * @param {StorageAccessData} storageAccessData - Cloud storage access data
 * @param {string} key - Key of result object
 * @param {string} privateKey - Private key to decode encrypted content
 * @param {string} isPublic - Whether the objest is using public bucket, or private bucket
 * @returns {Promise<Result>} - Downloaded result
 */
export const download = async (
  storageAccessData: StorageAccessData,
  key: string,
  privateKey: string,
  isPublic = false
): Promise<Result> => {
  const s3 = getS3Instance(storageAccessData);
  const params = {
    Bucket: getBucket(storageAccessData, isPublic),
    Key: key,
  };

  const { Body } = await s3.getObject(params).promise();

  const data = JSON.parse(Body?.toString('utf-8') || '');

  return data;
};

/**
 * **Upload result to cloud storage**
 *
 * @param {StorageAccessData} storageAccessData - Cloud storage access data
 * @param {Result} result - Result to upload
 * @param {string} publicKey - Public key to encrypt data if necessary
 * @param {string} encrypt - Whether to encrypt the result, or not
 * @param {string} isPublic - Whether to use public bucket, or private bucket
 * @returns {Promise<UploadResult>} - Uploaded result with key/hash
 */
export const upload = async (
  storageAccessData: StorageAccessData,
  result: Result,
  publicKey: string,
  encrypt = true,
  isPublic = false
): Promise<UploadResult> => {
  const s3 = getS3Instance(storageAccessData);

  const content = JSON.stringify(result);

  const hash = crypto.createHash('sha1').update(content).digest('hex');
  const key = `s3${hash}`;

  const params = {
    Bucket: getBucket(storageAccessData, isPublic),
    Key: key,
    Body: content,
  };

  await s3.putObject(params).promise();

  return { key, hash };
};
