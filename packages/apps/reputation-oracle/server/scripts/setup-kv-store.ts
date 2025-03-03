import 'dotenv/config';
import { KVStoreClient, KVStoreKeys, Role } from '@human-protocol/sdk';
import { Wallet, ethers } from 'ethers';
import * as Minio from 'minio';

async function setupCommonValues(kvStoreClient: KVStoreClient): Promise<void> {
  const { SUPPORTED_JOB_TYPES = '', SERVER_URL = '', FEE = '' } = process.env;

  if (!SUPPORTED_JOB_TYPES || SUPPORTED_JOB_TYPES.split(',').length === 0) {
    throw new Error('SUPPORTED_JOB_TYPES should be comma-separated list');
  }
  try {
    new URL(SERVER_URL || '');
  } catch (noop) {
    throw new Error('Invalid SERVER_URL');
  }
  let url = SERVER_URL.endsWith('/') ? SERVER_URL.slice(0, -1) : SERVER_URL;
  if (!url.startsWith('http')) {
    url = `http://${url}`;
  }

  const fee = Number(FEE);
  if (!Number.isInteger(fee) || fee < 1) {
    throw new Error('Fee must be positive integer');
  }

  await kvStoreClient.setBulk(
    [
      KVStoreKeys.role,
      KVStoreKeys.fee,
      KVStoreKeys.url,
      KVStoreKeys.webhookUrl,
      KVStoreKeys.jobTypes,
    ],
    [
      Role.ReputationOracle,
      `${fee}`,
      url,
      `${url}/webhook`,
      SUPPORTED_JOB_TYPES,
    ],
  );
}

type SetupPublicKeyFileMeta = {
  keyName: string;
  publicKey: string;
  s3Bucket: string;
  s3Endpoint: string;
  s3Port: string;
  kvKey: string;
};

async function setupPublicKeyFile(
  kvStoreClient: KVStoreClient,
  minioClient: Minio.Client,
  meta: SetupPublicKeyFileMeta,
): Promise<void> {
  const { keyName, kvKey, publicKey, s3Bucket, s3Endpoint, s3Port } = meta;
  const exists = await minioClient.bucketExists(s3Bucket);
  if (!exists) {
    throw new Error('Bucket does not exists');
  }

  await minioClient.putObject(s3Bucket, keyName, publicKey, {
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-store',
  });
  /**
   * Protocol is required for 'setFileUrlAndHash'
   */
  const _s3Endpoint = s3Endpoint.startsWith('http')
    ? s3Endpoint
    : `http://${s3Endpoint}`;
  const fileUrl = `${_s3Endpoint}:${s3Port}/${s3Bucket}/${keyName}`;
  await kvStoreClient.setFileUrlAndHash(fileUrl, kvKey);
}

async function setup(): Promise<void> {
  const { WEB3_PRIVATE_KEY, RPC_URL } = process.env;
  if (!WEB3_PRIVATE_KEY) {
    throw new Error('Private key is empty');
  }
  if (!RPC_URL) {
    throw new Error('RPC url is empty');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(WEB3_PRIVATE_KEY, provider);

  const kvStoreClient = await KVStoreClient.build(wallet);

  await setupCommonValues(kvStoreClient);

  const {
    S3_ENDPOINT,
    S3_PORT,
    S3_USE_SSL,
    S3_ACCESS_KEY,
    S3_SECRET_KEY,
    S3_BUCKET,
  } = process.env;

  if (
    [S3_ENDPOINT, S3_PORT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET].some(
      (value) => !value,
    )
  ) {
    throw new Error('Missing S3 config value');
  }
  if (!S3_ACCESS_KEY || !S3_SECRET_KEY) {
    throw new Error('S3 key is missing');
  }
  if (!S3_BUCKET) {
    throw new Error('S3 bucket is missing');
  }

  const s3Endpoint = S3_ENDPOINT || 'localhost';
  const s3Port = S3_PORT || '9000';
  const minioClient = new Minio.Client({
    endPoint: s3Endpoint,
    port: parseInt(s3Port, 10),
    useSSL: S3_USE_SSL === 'true',
    accessKey: S3_ACCESS_KEY,
    secretKey: S3_SECRET_KEY,
  });

  const { PGP_ENCRYPT, PGP_PUBLIC_KEY } = process.env;
  if (PGP_ENCRYPT && PGP_ENCRYPT === 'true') {
    if (!PGP_PUBLIC_KEY) {
      throw new Error('PGP public key is empty');
    }
    await setupPublicKeyFile(kvStoreClient, minioClient, {
      s3Endpoint,
      s3Port,
      s3Bucket: S3_BUCKET,
      publicKey: PGP_PUBLIC_KEY,
      keyName: 'pgp-public-key',
      kvKey: KVStoreKeys.publicKey,
    });
  }

  const { JWT_PUBLIC_KEY } = process.env;
  if (!JWT_PUBLIC_KEY) {
    throw new Error('JWT_PUBLIC_KEY is missing');
  }
  await setupPublicKeyFile(kvStoreClient, minioClient, {
    s3Endpoint,
    s3Port,
    s3Bucket: S3_BUCKET,
    publicKey: JWT_PUBLIC_KEY,
    keyName: 'jwt-public-key',
    kvKey: 'jwt_public_key',
  });
}

(async () => {
  try {
    await setup();
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup KV', error);
    process.exit(1);
  }
})();
