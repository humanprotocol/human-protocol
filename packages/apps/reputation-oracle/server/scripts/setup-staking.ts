import { StakingClient } from '@human-protocol/sdk';
import { HMToken__factory } from '@human-protocol/core/typechain-types';
import * as dotenv from 'dotenv';
import { Wallet, ethers } from 'ethers';

dotenv.config({ path: '.env.local' });

const RPC_URL = process.env.RPC_URL_LOCALHOST || 'http://0.0.0.0:8545';

export async function setup(): Promise<void> {
  if (!RPC_URL) {
    throw new Error('RPC url is empty');
  }

  const { WEB3_PRIVATE_KEY } = process.env;
  if (!WEB3_PRIVATE_KEY) {
    throw new Error('Private key is empty');
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const hmtTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const stakingAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  const wallet = new Wallet(WEB3_PRIVATE_KEY, provider);

  const hmtContract = HMToken__factory.connect(hmtTokenAddress, wallet);
  const hmtTx = await hmtContract.approve(stakingAddress, 1);
  await hmtTx.wait();

  const stakingClient = await StakingClient.build(wallet);
  await stakingClient.stake(BigInt(1));
}

setup();
