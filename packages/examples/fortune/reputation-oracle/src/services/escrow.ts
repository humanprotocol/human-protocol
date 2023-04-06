import EscrowAbi from '@human-protocol/core/abis/Escrow.json';
import Web3 from 'web3';

export async function getBalance(web3: Web3, escrowAddress: string) {
  const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
  return Number(await Escrow.methods.getBalance().call());
}

export async function getEscrowManifestUrl(
  web3: Web3,
  escrowAddress: string
): Promise<string> {
  const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
  return await Escrow.methods.manifestUrl().call();
}

export async function bulkPayOut(
  web3: Web3,
  escrowAddress: string,
  workerAddresses: string[],
  rewards: Array<string | number>,
  resultsUrl: string,
  resultHash: string
) {
  const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
  const gasNeeded = await Escrow.methods
    .bulkPayOut(workerAddresses, rewards, resultsUrl, resultHash, 1)
    .estimateGas({ from: web3.eth.defaultAccount });
  const gasPrice = await web3.eth.getGasPrice();

  await Escrow.methods
    .bulkPayOut(workerAddresses, rewards, resultsUrl, resultHash, 1)
    .send({ from: web3.eth.defaultAccount, gas: gasNeeded, gasPrice });
}
