import Web3 from 'web3';
import { BAD_WORDS } from '../constants/badWords';

export interface FortuneEntry {
  worker: string;
  fortune: string;
}

export interface ReputationEntry {
  workerAddress: string;
  reputation: number;
}

export function filterAddressesToReward(
  web3: Web3,
  addressFortunesEntries: FortuneEntry[]
) {
  const filteredResults: FortuneEntry[] = [];
  const reputationValues: ReputationEntry[] = [];
  const tmpHashMap: Record<string, boolean> = {};

  addressFortunesEntries.forEach((fortuneEntry) => {
    const { worker, fortune } = fortuneEntry;
    if (tmpHashMap[fortune] || checkBadWords(fortune)) {
      reputationValues.push({ workerAddress: worker, reputation: -1 });
      return;
    }

    tmpHashMap[fortune] = true;
    filteredResults.push(fortuneEntry);
    reputationValues.push({ workerAddress: worker, reputation: 1 });
  });
  const workerAddresses = filteredResults
    .map((fortune: { worker: string }) => fortune.worker)
    .map(web3.utils.toChecksumAddress);
  return { workerAddresses, reputationValues };
}

export function checkBadWords(fortune: string) {
  const words = fortune.replace(/[^a-zA-Z0-9 ]/g, '').split(' ');
  for (let i = 0; i < BAD_WORDS.length; i++) {
    for (let j = 0; j < words.length; j++) {
      if (words[j].toLowerCase() === BAD_WORDS[i].toString()) {
        return true;
      }
    }
  }
  return false;
}
