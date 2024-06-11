import { KVStoreClient, KVStoreKeys, Role } from '@human-protocol/sdk';
import { Wallet, ethers } from 'ethers';
import * as Minio from 'minio';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export async function setup(): Promise<void> {
  const privateKey = process.env.WEB3_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Private key is empty');
  }
  const jwtPublicKey = process.env.JWT_PUBLIC_KEY;
  if (!jwtPublicKey) {
    throw new Error('JWT public key is empty');
  }

  const minioClient = new Minio.Client({
    endPoint: process.env.S3_ENDPOINT || 'localhost',
    port: parseInt(process.env.S3_PORT || '9000', 10),
    useSSL: process.env.S3_USE_SSL === 'true',
    accessKey: process.env.S3_ACCESS_KEY || 'access-key',
    secretKey: process.env.S3_SECRET_KEY || 'secret-key',
  });
  const bucket = process.env.S3_BUCKET || 'bucket';
  const fileName = 'repo-jwt-public-key.txt';
  const exists = await minioClient.bucketExists(bucket);
  if (!exists) {
    throw new Error('Bucket does not exists');
  }
  try {
    await minioClient.putObject(bucket, fileName, jwtPublicKey, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
  } catch (e) {
    console.log(e);
  }

  const provider = new ethers.JsonRpcProvider('http://0.0.0.0:8545');
  const wallet = new Wallet(privateKey, provider);

  const kvStoreClient = await KVStoreClient.build(wallet);
  await kvStoreClient.setBulk(
    [KVStoreKeys.role, KVStoreKeys.fee, KVStoreKeys.webhookUrl],
    [Role.ReputationOracle, '1', 'http://localhost:5003/webhook'],
    { nonce: 0 },
  );
  await kvStoreClient.setFileUrlAndHash(
    `http://localhost:9000/bucket/${fileName}`,
    'jwt_public_key',
    { nonce: 1 },
  );

  if (process.env.PGP_ENCRYPT && process.env.PGP_ENCRYPT === 'true') {
    if (!process.env.PGP_PUBLIC_KEY) {
      throw new Error('PGP public key is empty');
    }
    const fileName = 'repo-pgp-public-key.txt';

    await minioClient.putObject(bucket, fileName, process.env.PGP_PUBLIC_KEY, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    await kvStoreClient.setFileUrlAndHash(
      `http://localhost:9000/bucket/${fileName}`,
      KVStoreKeys.publicKey,
      { nonce: 2 },
    );
  }
}

setup();
