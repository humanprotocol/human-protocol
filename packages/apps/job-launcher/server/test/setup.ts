import {
  StakingClient,
  KVStoreClient,
  KVStoreKeys,
  Role,
} from '@human-protocol/sdk';
import { Wallet, ethers } from 'ethers';
import { HMToken__factory } from '@human-protocol/core/typechain-types';

export async function setup(): Promise<void> {
  const privateKey = '';
  const provider = new ethers.JsonRpcProvider('');
  const hmtTokenAddress = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4';
  const stakingAddress = '0x7Fd3dF914E7b6Bd96B4c744Df32183b51368Bfac';
  const wallet = new Wallet(privateKey, provider);

  const hmtContract = HMToken__factory.connect(hmtTokenAddress, wallet);
  await (await hmtContract.approve(stakingAddress, 1)).wait();

  const stakingClient = await StakingClient.build(wallet);
  await stakingClient.stake(BigInt(1));
  const kvStoreClient = await KVStoreClient.build(wallet);
  await kvStoreClient.setBulk(
    [KVStoreKeys.role, KVStoreKeys.fee, KVStoreKeys.webhookUrl],
    [Role.JobLauncher, '1', 'http://localhost:5000'],
  );
}

setup();
