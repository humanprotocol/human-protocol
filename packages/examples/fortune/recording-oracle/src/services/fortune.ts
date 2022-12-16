import Web3 from 'web3';
import {
  getEscrowStatus,
  getEscrowManifestUrl,
  getRecordingOracleAddress,
  storeResults,
} from './escrow';
import { getManifest } from './manifest';
import { bulkPayout } from './reputationClient';
import { uploadResults } from './s3';
import {
  cleanFortunes,
  getEscrow,
  getFortunes,
  getWorkerResult,
  newEscrow,
  putFortune,
} from './storage';

const statusesMap = [
  'Launched',
  'Pending',
  'Partial',
  'Paid',
  'Complete',
  'Cancelled',
];

export async function addFortune(
  web3: Web3,
  workerAddress: string,
  escrowAddress: string,
  fortune: string
) {
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

  const escrowRecOracleAddr = await getRecordingOracleAddress(
    web3,
    escrowAddress
  );

  if (
    web3.utils.toChecksumAddress(escrowRecOracleAddr) !==
    web3.utils.toChecksumAddress(web3.eth.defaultAccount as string)
  ) {
    return {
      field: 'escrowAddress',
      message: 'The Escrow Recording Oracle address mismatches the current one',
    };
  }

  const escrowStatus = await getEscrowStatus(web3, escrowAddress);

  if (statusesMap[escrowStatus] !== 'Pending') {
    return {
      field: 'escrowAddress',
      message: 'The Escrow is not in the Pending status',
    };
  }

  const manifestUrl = await getEscrowManifestUrl(web3, escrowAddress);
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

  const resultUrl = await uploadResults(
    fortunes.map(({ fortune }: { fortune: any }) => fortune),
    escrowAddress
  );
  // TODO calculate the URL hash(?)
  const resultHash = resultUrl;

  await storeResults(web3, escrowAddress, resultUrl, resultHash);

  if (fortunes.length === fortunesRequested) {
    await bulkPayout(reputationOracleUrl, escrowAddress, fortunes, resultUrl);
    cleanFortunes(escrowAddress);
  }

  return null;
}
