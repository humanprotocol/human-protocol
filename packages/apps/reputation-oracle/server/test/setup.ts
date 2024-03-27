import { KVStoreClient, KVStoreKeys, Role } from '@human-protocol/sdk';
import { Wallet, ethers } from 'ethers';
import * as dotenv from 'dotenv';
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
    [Role.ReputationOracle, '1', 'http://localhost:5003/webhook'],
  );
}

setup();
