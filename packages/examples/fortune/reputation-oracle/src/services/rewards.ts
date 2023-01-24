import Web3 from 'web3';
import { BAD_WORDS } from '../constants/badWords';

export interface FortuneEntry {
  worker: string;
  fortune: string;
  result: boolean;
}

export interface ReputationEntry {
  workerAddress: string;
  reputation: number;
}

export function filterAddressesToReward(
  web3: Web3,
  addressFortunesEntries: FortuneEntry[],
  recordingOracleAddress: string
) {
  const filteredResults: FortuneEntry[] = [];
  const reputationValues: ReputationEntry[] = [];
  const tmpHashMap: Record<string, boolean> = {};
  let errorRecordingOracle = false;

  addressFortunesEntries.forEach((fortuneEntry) => {
    const { worker, fortune, result } = fortuneEntry;
    if (tmpHashMap[fortune] || checkBadWords(fortune)) {
      reputationValues.push({ workerAddress: worker, reputation: -1 });
      if (!result) {
        errorRecordingOracle = true;
      }
      return;
    } else if (!tmpHashMap[fortune] && !checkBadWords(fortune) && result) {
      errorRecordingOracle = true;
    }

    tmpHashMap[fortune] = true;
    filteredResults.push(fortuneEntry);
    reputationValues.push({ workerAddress: worker, reputation: 1 });
  });
  const workerAddresses = filteredResults
    .map((fortune: { worker: string }) => fortune.worker)
    .map(web3.utils.toChecksumAddress);
  if (errorRecordingOracle) {
    reputationValues.push({
      workerAddress: recordingOracleAddress,
      reputation: -1,
    });
  } else {
    reputationValues.push({
      workerAddress: recordingOracleAddress,
      reputation: 1,
    });
  }
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
