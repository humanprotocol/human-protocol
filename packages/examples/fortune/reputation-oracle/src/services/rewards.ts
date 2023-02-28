import { Address } from '@multiversx/sdk-core/out';

export function calculateRewardForWorker(
  totalReward: number,
  workerAddresses: string[] | Address[]
) {
  const rewardValue = Math.floor(totalReward / workerAddresses.length);
  return workerAddresses.map(() => rewardValue.toString());
}
