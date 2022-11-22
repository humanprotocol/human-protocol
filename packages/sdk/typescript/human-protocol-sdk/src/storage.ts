import AWS from 'aws-sdk';
import crypto from 'crypto';

import {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_REQUEST_ENDPOINT,
  ESCROW_BUCKETNAME,
  ESCROW_PUBLIC_BUCKETNAME,
} from './constants';
import { UploadResult } from './types';

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3({
  endpoint: AWS_REQUEST_ENDPOINT,
  region: AWS_REGION,
});

const getBucket = (isPublic: boolean) => {
  return isPublic ? ESCROW_PUBLIC_BUCKETNAME : ESCROW_BUCKETNAME;
};

export const getPublicURL = (key: string): string => {
  return `https://${ESCROW_PUBLIC_BUCKETNAME}.s3.amazonaws.com/${key}`;
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

export const download = async (
  key: string,
  privateKey: string,
  isPublic = false
): Promise<Record<string, string | number>> => {
  const params = {
    Bucket: getBucket(isPublic),
    Key: key,
  };

  const { Body } = await s3.getObject(params).promise();

  const data = JSON.parse(Body?.toString('utf-8') || '');

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
