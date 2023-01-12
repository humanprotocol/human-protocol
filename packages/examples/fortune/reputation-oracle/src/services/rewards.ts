import Web3 from 'web3';

export interface FortuneEntry {
  worker: string;
  fortune: string;
}

export function filterAddressesToReward(
  web3: Web3,
  addressFortunesEntries: FortuneEntry[]
) {
  const filteredResults: FortuneEntry[] = [];
  const tmpHashMap: Record<string, boolean> = {};

  addressFortunesEntries.forEach((fortuneEntry) => {
    const { fortune } = fortuneEntry;
    if (tmpHashMap[fortune]) {
      return;
    }

    tmpHashMap[fortune] = true;
    filteredResults.push(fortuneEntry);
  });

  return filteredResults
    .map((fortune: { worker: string }) => fortune.worker)
    .map(web3.utils.toChecksumAddress);
}

export function calculateRewardForWorker(
  totalReward: number,
  workerAddresses: string[]
) {
  const rewardValue = Math.floor(totalReward / workerAddresses.length);
  return workerAddresses.map(() => rewardValue.toString());
}
