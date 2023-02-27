import Web3 from 'web3';
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
import { MxService } from '../utils/mx.service';
import { Address } from '@multiversx/sdk-core/out';
import { Web3Service } from '../utils/web3.service';
import { UserSigner } from '@multiversx/sdk-wallet/out';

function processAddress(escrowAddress: string, web3: Web3): string | Address {
  if (web3.utils.isAddress(escrowAddress)) {
    return escrowAddress;
  }

  try {
    return new Address(escrowAddress);
  } catch (e) {
    throw new Error('Valid escrow address required');
  }
}

function initContract(
  escrowAddress: string | Address,
  web3: Web3,
  mxSigner: UserSigner
): MxService | Web3Service {
  if (escrowAddress instanceof Address) {
    return new MxService(escrowAddress, mxSigner);
  }

  return new Web3Service(escrowAddress, web3);
}

function checkCorrectOracleAddress(
  recOracleAddress: string | Address,
  web3: Web3,
  mxSigner: UserSigner
) {
  if (recOracleAddress instanceof Address) {
    const oracleAddress = mxSigner.getAddress();
    if (oracleAddress == recOracleAddress) {
      throw new Error('Recording oracle address is not correct');
    }
  } else {
    if (!web3.utils.isAddress(recOracleAddress)) {
      throw new Error('Recording oracle address is not correct');
    }

    if (
      web3.utils.toChecksumAddress(recOracleAddress) !==
      web3.utils.toChecksumAddress(web3.eth.defaultAccount as string)
    ) {
      throw new Error('Recording oracle address is not correct');
    }
  }
}

export async function addFortune(
  web3: Web3,
  mxSigner: UserSigner,
  workerAddress: string,
  escrowAddress: string,
  fortune: string
) {
  let processedEscrowAddress: string | Address;
  try {
    processedEscrowAddress = processAddress(escrowAddress, web3);
  } catch (e) {
    return {
      field: 'escrowAddress',
      message: 'Valid escrow address required',
    };
  }

  let escrowContract: MxService | Web3Service;
  try {
    escrowContract = initContract(processedEscrowAddress, web3, mxSigner);
  } catch (e) {
    return {
      error: 'Cannot initialize escrow contract',
    };
  }

  try {
    processAddress(workerAddress, web3);
  } catch (e) {
    return {
      field: 'workerAddress',
      message: 'Valid address required',
    };
  }

  if (!fortune) {
    return {
      field: 'fortune',
      message: 'Non-empty fortune is required',
    };
  }

  const escrowRecOracleAddr = await escrowContract.getRecordingOracleAddress();
  let processedRecOracleAddress: string | Address;
  try {
    processedRecOracleAddress = processAddress(escrowRecOracleAddr, web3);
  } catch (e) {
    return {
      data: 'recordingEscrowAddress',
      message: 'Valid recording escrow address required',
    };
  }

  try {
    checkCorrectOracleAddress(processedRecOracleAddress, web3, mxSigner);
  } catch (e) {
    return {
      field: 'escrowAddress',
      message: 'The Escrow Recording Oracle address mismatches the current one',
    };
  }

  const escrowStatus = await escrowContract.getEscrowStatus();
  if (escrowStatus !== 'Pending') {
    return {
      field: 'escrowAddress',
      message: 'The Escrow is not in the Pending status',
    };
  }

  const manifestUrl = await escrowContract.getEscrowManifestUrl();

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fortunes.map(({ fortune }: { fortune: any }) => fortune),
    escrowAddress
  );
  // TODO calculate the URL hash(?)
  const resultHash = resultUrl;

  try {
    await escrowContract.storeResults(resultUrl, resultHash);
  } catch (e) {
    console.error('Cannot store results', e);
    return { error: 'Cannot store results' };
  }

  if (fortunes.length === fortunesRequested) {
    await bulkPayout(reputationOracleUrl, escrowAddress, fortunes);
    cleanFortunes(escrowAddress);
  }

  return null;
}
