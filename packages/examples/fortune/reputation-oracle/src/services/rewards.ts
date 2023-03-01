import Web3 from 'web3';
import { BAD_WORDS } from '../constants/badWords';

export interface FortuneEntry {
  fortune: string;
  score: boolean;
}

export interface ReputationEntry {
  workerAddress: string;
  reputation: number;
}

export function filterAddressesToReward(
  web3: Web3,
  fortunesEntries: { [key: string]: FortuneEntry[] },
  recordingOracleAddress: string
) {
  const filteredWorkers: string[] = [];
  const reputationValues: ReputationEntry[] = [];
  const tmpHashMap: Record<string, boolean> = {};
  let errorRecordingOracle = false;

  Object.keys(fortunesEntries).forEach((workerAddress) => {
    fortunesEntries[workerAddress].forEach((fortuneEntry) => {
      const { fortune, score } = fortuneEntry;
      if (tmpHashMap[fortune] || checkBadWords(fortune)) {
        reputationValues.push({ workerAddress, reputation: -1 });
        if (score) {
          errorRecordingOracle = true;
        }
        return;
      } else if (!tmpHashMap[fortune] && !checkBadWords(fortune) && !score) {
        errorRecordingOracle = true;
      }

      tmpHashMap[fortune] = true;
      reputationValues.push({ workerAddress, reputation: 1 });
      if (!filteredWorkers.includes(workerAddress))
        filteredWorkers.push(workerAddress);
    });
  });
  const workerAddresses = filteredWorkers.map(web3.utils.toChecksumAddress);
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
