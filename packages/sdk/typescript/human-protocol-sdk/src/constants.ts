import dotenv from 'dotenv';

dotenv.config();

export const HMTOKEN_ADDR =
  process.env.HMTOKEN_ADDR || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
export const KVSTORE_CONTRACT =
  process.env.KVSTORE_CONTRACT || '0xbcF8274FAb0cbeD0099B2cAFe862035a6217Bf44';

export const SHARED_MAC =
  process.env.SHARED_MAC ||
  '9da0d3721774843193737244a0f3355191f66ff7321e83eae83f7f746eb34350';

export const ESCROW_BUCKETNAME =
  process.env.ESCROW_BUCKETNAME || 'escrow-results';
export const ESCROW_PUBLIC_BUCKETNAME =
  process.env.ESCROW_PUBLIC_BUCKETNAME || 'escrow-public-results';

export const ESCROW_AWS_ACCESS_KEY_ID =
  process.env.ESCROW_AWS_ACCESS_KEY_ID || 'minio';

export const ESCROW_AWS_SECRET_ACCESS_KEY =
  process.env.ESCROW_AWS_SECRET_ACCESS_KEY || 'minio123';

export const ESCROW_RESULTS_AWS_S3_ACCESS_KEY_ID =
  process.env.ESCROW_RESULTS_AWS_S3_ACCESS_KEY_ID || '';

export const ESCROW_RESULTS_AWS_S3_SECRET_ACCESS_KEY =
  process.env.ESCROW_RESULTS_AWS_S3_SECRET_ACCESS_KEY || '';

export const ESCROW_AWS_REGION = process.env.ESCROW_AWS_REGION || 'us-west-2';

export const ESCROW_ENDPOINT_URL =
  process.env.ESCROW_ENDPOINT_URL || 'http://minio:9000';
