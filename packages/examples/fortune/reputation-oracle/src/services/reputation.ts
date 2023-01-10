import ReputationABI from '@human-protocol/core/abis/Reputation.json';
import Web3 from 'web3';
import { ReputationEntry } from './rewards';

const reputationAddress =
  process.env.REPUTATION_ADDRESS ||
  '0x09635F643e140090A9A8Dcd712eD6285858ceBef';

export async function updateReputations(
  web3: Web3,
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

  console.log(
    `Reputations will be send, gasNeeded : ${gasNeeded}, gasPrice: ${gasPrice} `
  );

  await Reputation.methods
    .addReputations(reputationValues)
    .send({ from: web3.eth.defaultAccount, gas: gasNeeded, gasPrice });
  const reputationScores = await Reputation.methods
    .getReputations(workers)
    .call();

  return reputationScores;
}
