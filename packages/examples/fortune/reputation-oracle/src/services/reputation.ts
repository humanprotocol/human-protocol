import ReputationABI from '@human-protocol/core/abis/Reputation.json';
import Web3 from 'web3';
import { ReputationEntry } from './rewards';

export async function updateReputations(
  web3: Web3,
  reputationAddress: string,
  reputationValues: ReputationEntry[],
  workers: string[]
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

  const reputationScores = await Reputation.methods
    .getReputations(workers)
    .call();

  return reputationScores;
}
