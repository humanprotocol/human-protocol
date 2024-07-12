import { KVStoreClient, KVStoreKeys, Role } from '@human-protocol/sdk';
import { Wallet, ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as Minio from 'minio';
dotenv.config({ path: '.env.local' });

export async function setup(): Promise<void> {
  const privateKey = process.env.WEB3_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Private key is empty');
  }
  const provider = new ethers.JsonRpcProvider('http://0.0.0.0:8545');
  const wallet = new Wallet(privateKey, provider);

  const kvStoreClient = await KVStoreClient.build(wallet);
  await kvStoreClient.setBulk(
    [KVStoreKeys.role, KVStoreKeys.fee, KVStoreKeys.webhookUrl],
    [Role.RecordingOracle, '1', 'http://localhost:5002/webhook'],
    {
      nonce: 0,
    },
  );

  if (process.env.PGP_ENCRYPT && process.env.PGP_ENCRYPT === 'true') {
    if (!process.env.PGP_PUBLIC_KEY) {
      throw new Error('PGP public key is empty');
    }
    const minioClient = new Minio.Client({
      endPoint: process.env.S3_ENDPOINT || 'localhost',
      port: parseInt(process.env.S3_PORT || '9000', 10),
      useSSL: process.env.S3_USE_SSL === 'true',
      accessKey: process.env.S3_ACCESS_KEY || 'access-key',
      secretKey: process.env.S3_SECRET_KEY || 'secret-key',
    });
    const bucket = process.env.S3_BUCKET || 'bucket';
    const fileName = 'reco-pgp-public-key.txt';
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      throw new Error('Bucket does not exists');
    }
    try {
      await minioClient.putObject(
        bucket,
        fileName,
        process.env.PGP_PUBLIC_KEY,
        {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      );
      await kvStoreClient.setFileUrlAndHash(
        `http://localhost:9000/bucket/${fileName}`,
        KVStoreKeys.publicKey,
        {
          nonce: 1,
        },
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
}

setup();
