import axios from 'axios';
import { EscrowStatus } from '../constants/escrow';
import { IFortuneRequest, IFortuneResults } from '../interfaces/fortunes';
import { IPlugin } from '../interfaces/plugins';
import * as crypto from 'crypto';
import { sendFortunes } from './reputationOracleClient';
import { IEscrowStorage } from '../interfaces/storage';

export async function getManifestByUrl(manifestUrl: string) {
  const response = await axios.get(manifestUrl);

  if (!response.data) {
    throw new Error('Not Found');
  }

  return response.data;
}

async function saveFortuneResults(
  plugins: IPlugin,
  results: IFortuneResults
): Promise<string> {
  return await plugins.s3.saveData(results.escrowAddress, results);
}

function isFortunesRequestedDone(escrow: IEscrowStorage): boolean {
  const data = Object.values(escrow.fortunes);
  const validFortunes = data.filter((item) => item[0].score);

  if (validFortunes.length < escrow.fortunesRequested) {
    return false;
  }

  return true;
}

function getFortunesContent(escrow: IEscrowStorage): string[] {
  const data = Object.values(escrow.fortunes);
  return data.map((item) => item[0].fortune);
}

async function isValidFortune(
  plugins: IPlugin,
  fortune: IFortuneRequest,
  escrow: IEscrowStorage
): Promise<boolean> {
  const fortunesContent = getFortunesContent(escrow);

  if (
    plugins.curses.isProfane(fortune.fortune) ||
    !plugins.uniqueness.isUnique(fortune.fortune, fortunesContent)
  ) {
    escrow = plugins.storage.addFortune(
      fortune.escrowAddress,
      fortune.workerAddress,
      fortune.fortune,
      false
    );

    const fortuneResults = {
      escrowAddress: fortune.escrowAddress,
      chainId: escrow.chainId,
      fortunes: escrow.fortunes,
    };

    await saveFortuneResults(plugins, fortuneResults);
    return false;
  }

  return true;
}

export async function processFortunes(
  plugins: IPlugin,
  fortune: IFortuneRequest
) {
  const web3 = plugins.web3[fortune.chainId];

  if (!web3.utils.isAddress(fortune.escrowAddress)) {
    throw new Error('Valid ethereum address required for escrowAddress');
  }

  if (!web3.utils.isAddress(fortune.workerAddress)) {
    throw new Error('Valid ethereum address required for workerAddress');
  }

  if (!fortune.fortune) {
    throw new Error('Non-empty fortune is required');
  }

  const recordingOracleAddress = await plugins.escrow.getRecordingOracleAddress(
    web3,
    fortune.escrowAddress
  );

  if (
    web3.utils.toChecksumAddress(recordingOracleAddress) !==
    web3.utils.toChecksumAddress(web3.eth.defaultAccount as string)
  ) {
    throw new Error(
      'Escrow Recording Oracle address mismatches the current one'
    );
  }

  const escrowStatus = await plugins.escrow.getEscrowStatus(
    web3,
    fortune.escrowAddress
  );

  if (EscrowStatus[escrowStatus] !== EscrowStatus[EscrowStatus.Pending]) {
    throw new Error('Escrow is not in the Pending status');
  }

  const manifestUrl = await plugins.escrow.getEscrowManifestUrl(
    web3,
    fortune.escrowAddress
  );

  const { fortunesRequired, reputationOracleUrl } = await getManifestByUrl(
    manifestUrl
  );

  if (!fortunesRequired || !reputationOracleUrl) {
    throw new Error('Manifest does not contain the required data');
  }

  let escrow = plugins.storage.getEscrow(fortune.escrowAddress);

  if (!escrow) {
    escrow = plugins.storage.addEscrow(
      fortune.escrowAddress,
      fortune.chainId,
      fortunesRequired
    );
  }

  if (isFortunesRequestedDone(escrow)) {
    throw new Error('All fortunes have already been sent');
  }

  const fortunesStored = plugins.storage.getFortunes(
    fortune.escrowAddress,
    fortune.workerAddress
  );

  if (Array.isArray(fortunesStored) && fortunesStored.length > 0) {
    const fortuneStored = fortunesStored[0];

    if (!fortuneStored.score) {
      const isValid = await isValidFortune(plugins, fortune, escrow);
      if (!isValid) throw new Error('Fortune is not unique or contains curses');

      escrow = plugins.storage.addFortune(
        fortune.escrowAddress,
        fortune.workerAddress,
        fortune.fortune,
        true
      );
    } else {
      throw new Error(
        `${fortune.workerAddress} already submitted correct a fortune`
      );
    }
  } else {
    const isValid = await isValidFortune(plugins, fortune, escrow);
    if (!isValid) {
      throw new Error('Fortune is not unique or contains curses');
    }

    escrow = plugins.storage.addFortune(
      fortune.escrowAddress,
      fortune.workerAddress,
      fortune.fortune,
      true
    );
  }

  const fortuneResults = {
    escrowAddress: fortune.escrowAddress,
    chainId: escrow.chainId,
    fortunes: escrow.fortunes,
  };

  const fortuneResultsUrl = await saveFortuneResults(plugins, fortuneResults);

  const fortuneResultsHash = crypto
    .createHash('sha256')
    .update(escrow.toString())
    .digest('hex');

  await plugins.escrow.storeResults(
    web3,
    fortune.escrowAddress,
    fortune.workerAddress,
    fortuneResultsUrl,
    fortuneResultsHash
  );

  if (isFortunesRequestedDone(escrow)) {
    await sendFortunes(reputationOracleUrl, fortuneResults);
    return { response: 'The requested fortunes have been completed.' };
  }

  return { response: true };
}
