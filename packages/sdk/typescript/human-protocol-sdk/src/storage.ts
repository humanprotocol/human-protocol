import AWS from 'aws-sdk';
import crypto from 'crypto';

import {
  ESCROW_AWS_ACCESS_KEY_ID,
  ESCROW_AWS_SECRET_ACCESS_KEY,
  ESCROW_BUCKETNAME,
  ESCROW_PUBLIC_BUCKETNAME,
} from './constants';
import { UploadResult } from './types';

const s3 = new AWS.S3();

AWS.config.update({
  accessKeyId: ESCROW_AWS_ACCESS_KEY_ID,
  secretAccessKey: ESCROW_AWS_SECRET_ACCESS_KEY,
});

const getBucket = (isPublic: boolean) => {
  return isPublic ? ESCROW_PUBLIC_BUCKETNAME : ESCROW_BUCKETNAME;
};

export const getPublicURL = (key: string): string => {
  return `https://${getBucket(true)}.s3.amazonaws.com/${key}`;
};

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

export const downloadFromStorage = async (key: string, isPublic: boolean) => {
  const params = {
    Bucket: getBucket(isPublic),
    Key: key,
  };

  const { Body } = await s3.getObject(params).promise();

  return Body;
};

export const download = async (
  key: string,
  privateKey: string,
  isPublic = false
): Promise<Record<string, string | number>> => {
  const content = await downloadFromStorage(key, isPublic);

  const data = JSON.parse(content?.toString('utf-8') || '');

  return data;
};

export const upload = async (
  data: Record<string, string | number>,
  publicKey: string,
  encrypt = true,
  isPublic = false
): Promise<UploadResult> => {
  const content = JSON.stringify(data);

  const hash = crypto.createHash('sha1').update(content).digest('hex');
  const key = `s3${hash}`;

  const params = {
    Bucket: getBucket(isPublic),
    Key: key,
    Body: content,
  };

  await s3.putObject(params);

  return { key, hash };
};
