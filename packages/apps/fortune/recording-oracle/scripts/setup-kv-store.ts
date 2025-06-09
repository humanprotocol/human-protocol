import { KVStoreClient, KVStoreKeys, Role } from '@human-protocol/sdk';
import * as dotenv from 'dotenv';
import { Wallet, ethers } from 'ethers';
import * as Minio from 'minio';

const isLocalEnv = process.env.LOCAL === 'true';

let ENV_FILE_PATH = '.env';
if (isLocalEnv) {
  ENV_FILE_PATH += '.local';
}
dotenv.config({ path: ENV_FILE_PATH });

const RPC_URL = isLocalEnv
  ? process.env.RPC_URL_LOCALHOST
  : process.env.RPC_URL_POLYGON_AMOY;

const SUPPORTED_JOB_TYPES = 'fortune';
const ROLE = Role.RecordingOracle;

async function setupCommonValues(kvStoreClient: KVStoreClient): Promise<void> {
  const { SERVER_URL, HOST, PORT, FEE = '1' } = process.env;

  if (SUPPORTED_JOB_TYPES.split(',').length === 0) {
    throw new Error('SUPPORTED_JOB_TYPES should be comma-separated list');
  }

  const serverUrl = SERVER_URL || `http://${HOST}:${PORT}`;
  try {
    new URL(serverUrl);
  } catch (_noop) {
    throw new Error('Invalid SERVER_URL');
  }
  let url = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
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
    [ROLE, fee.toString(), url, `${url}/webhook`, SUPPORTED_JOB_TYPES],
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
  if (!RPC_URL) {
    throw new Error('RPC url is empty');
  }

  const { WEB3_PRIVATE_KEY } = process.env;
  if (!WEB3_PRIVATE_KEY) {
    throw new Error('Private key is empty');
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

  const s3Endpoint = S3_ENDPOINT as string;
  const s3Port = S3_PORT as string;
  const s3AccessKey = S3_ACCESS_KEY as string;
  const s3SecretKey = S3_SECRET_KEY as string;
  const s3Bucket = S3_BUCKET as string;

  const minioClient = new Minio.Client({
    endPoint: s3Endpoint,
    port: parseInt(s3Port, 10),
    useSSL: S3_USE_SSL === 'true',
    accessKey: s3AccessKey,
    secretKey: s3SecretKey,
  });

  const {
    PGP_ENCRYPT,
    PGP_PUBLIC_KEY,
    PGP_PUBLIC_KEY_FILE = 'pgp-public-key-reco',
  } = process.env;
  if (PGP_ENCRYPT === 'true') {
    if (!PGP_PUBLIC_KEY) {
      throw new Error('PGP public key is empty');
    }

    await setupPublicKeyFile(kvStoreClient, minioClient, {
      s3Endpoint,
      s3Port,
      s3Bucket,
      publicKey: PGP_PUBLIC_KEY,
      keyName: PGP_PUBLIC_KEY_FILE,
      kvKey: KVStoreKeys.publicKey,
    });
  }
}

(async () => {
  try {
    await setup();
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup KV.', error);
    process.exit(1);
  }
})();
