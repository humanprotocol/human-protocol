import ReputationABI from '@human-protocol/core/abis/Reputation.json';
import Web3 from 'web3';
import { ReputationEntry } from './rewards';

export async function updateReputations(
  web3: Web3,
  reputationAddress: string,
  reputationValues: ReputationEntry[]
) {
  const Reputation = new web3.eth.Contract(
    ReputationABI as [],
    reputationAddress
  );

  const gasNeeded = await Reputation.methods
    .addReputations(reputationValues)
    .estimateGas({ from: web3.eth.defaultAccount });
  const gasPrice = await web3.eth.getGasPrice();

  await Reputation.methods
    .addReputations(reputationValues)
    .send({ from: web3.eth.defaultAccount, gas: gasNeeded, gasPrice });
}

export async function getReputations(
  web3: Web3,
  reputationAddress: string,
  workerAddresses: string[]
) {
  const Reputation = new web3.eth.Contract(
    ReputationABI as [],
    reputationAddress
  );
  const reputationScores = await Reputation.methods
    .getReputations(workerAddresses)
    .call();
  return reputationScores;
}

export async function calculateRewardForWorker(
  web3: Web3,
  reputationAddress: string,
  totalReward: string,
  workerAddresses: string[]
) {
  const Reputation = new web3.eth.Contract(
    ReputationABI as [],
    reputationAddress
  );
  const result = await Reputation.methods
    .getRewards(totalReward, workerAddresses)
    .call();
  return result;
}
