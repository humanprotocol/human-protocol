import EscrowAbi from '@human-protocol/core/abis/Escrow.json';
import Web3 from 'web3';

export async function getRecordingOracleAddress(
  web3: Web3,
  escrowAddress: string
): Promise<string> {
  const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
  return await Escrow.methods.recordingOracle().call();
}

export async function getEscrowStatus(
  web3: Web3,
  escrowAddress: string
): Promise<number> {
  const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
  return await Escrow.methods.status().call();
}

export async function getEscrowManifestUrl(
  web3: Web3,
  escrowAddress: string
): Promise<string> {
  const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
  return await Escrow.methods.manifestUrl().call();
}

export async function storeResults(
  web3: Web3,
  escrowAddress: string,
  resultsUrl: string,
  resultHash: string
) {
  const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
  const gasNeeded = await Escrow.methods
    .storeResults(resultsUrl, resultHash)
    .estimateGas({ from: web3.eth.defaultAccount });
  const gasPrice = await web3.eth.getGasPrice();

  await Escrow.methods
    .storeResults(resultsUrl, resultHash)
    .send({ from: web3.eth.defaultAccount, gas: gasNeeded, gasPrice });
}
