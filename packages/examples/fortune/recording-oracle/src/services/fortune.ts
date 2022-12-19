import Web3 from 'web3';
import EscrowAbi from '@human-protocol/core/abis/Escrow.json';
import {
  cleanFortunes,
  getEscrow,
  getFortunes,
  getWorkerResult,
  newEscrow,
  putFortune,
} from './storage';
import { getManifest } from './manifest';
import { bulkPayout } from './reputationClient';

const statusesMap = [
  'Launched',
  'Pending',
  'Partial',
  'Paid',
  'Complete',
  'Cancelled',
];

export interface FortuneError {
  message: string;
  field?: string;
}

export async function addFortune(
  web3: Web3,
  workerAddress: string,
  escrowAddress: string,
  fortune: string
): Promise<FortuneError | null> {
  if (!web3.utils.isAddress(workerAddress)) {
    return {
      field: 'workerAddress',
      message: 'Valid ethereum address required',
    };
  }
  if (!fortune) {
    return { field: 'fortune', message: 'Non-empty fortune is required' };
  }

  if (!web3.utils.isAddress(escrowAddress)) {
    return {
      field: 'escrowAddress',
      message: 'Valid ethereum address required',
    };
  }
  const Escrow = new web3.eth.Contract(EscrowAbi as [], escrowAddress);
  const escrowRecOracleAddr = await Escrow.methods.recordingOracle().call();

  if (
    web3.utils.toChecksumAddress(escrowRecOracleAddr) !==
    web3.utils.toChecksumAddress(web3.eth.defaultAccount as string)
  ) {
    return {
      field: 'escrowAddress',
      message: 'The Escrow Recording Oracle address mismatches the current one',
    };
  }

  const escrowStatus = await Escrow.methods.status().call();

  if (statusesMap[escrowStatus] !== 'Pending') {
    return {
      field: 'escrowAddress',
      message: 'The Escrow is not in the Pending status',
    };
  }

  const manifestUrl = await Escrow.methods.manifestUrl().call();
  const {
    fortunes_requested: fortunesRequested,
    reputation_oracle_url: reputationOracleUrl,
  } = await getManifest(manifestUrl);

  if (!getEscrow(escrowAddress)) {
    newEscrow(escrowAddress);
  }

  const workerPreviousResult = getWorkerResult(escrowAddress, workerAddress);

  if (workerPreviousResult) {
    return { message: `${workerAddress} already submitted a fortune` };
  }

  putFortune(escrowAddress, workerAddress, fortune);
  const fortunes = getFortunes(escrowAddress);
  if (fortunes.length === fortunesRequested) {
    await bulkPayout(reputationOracleUrl, escrowAddress, fortunes);
    cleanFortunes(escrowAddress);
  }

  return null;
}
