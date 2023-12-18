import { ConfigType, registerAs } from '@nestjs/config';

export const s3Config = registerAs('s3', () => ({
  endPoint: process.env.S3_ENDPOINT || '127.0.0.1',
  port: +(process.env.S3_PORT || 9000),
  accessKey: process.env.S3_ACCESS_KEY || '',
  secretKey: process.env.S3_SECRET_KEY || '',
  bucket: process.env.S3_BUCKET || '',
  useSSL: process.env.S3_USE_SSL === 'true',
}));

export const s3ConfigKey = s3Config.KEY;
export type S3ConfigType = ConfigType<typeof s3Config>;
