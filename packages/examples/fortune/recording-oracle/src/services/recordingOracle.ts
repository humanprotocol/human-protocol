import axios from 'axios';
import { EscrowStatus } from '../constants/escrow.js';
import { IFortuneRequest, IFortuneResults } from '../interfaces/fortunes.js';
import { IPlugin } from '../interfaces/plugins.js';
import * as crypto from "crypto";
import { sendFortunes } from './reputationOracleClient.js';
import { IEscrowStorage } from 'interfaces/storage.js';


export async function getManifestByUrl(manifestUrl: string) {
  const response = await axios.get(manifestUrl);

  if (!response.data) {
    throw new Error("Not Found")
  }

  return response.data;
}

async function saveFortuneResults(plugins: IPlugin, results: IFortuneResults): Promise<string> {
  return await plugins.s3.saveData(results.escrowAddress, results)
}

function isFortunesRequestedDone(escrow: IEscrowStorage): boolean {
  const data = Object.values(escrow.fortunes)
  const validFortunes = data.filter(item => item.score);

  if (validFortunes.length < escrow.fortunesRequested) {
    return false;
  }

  return true;
}

function getFortunesContent(escrow: IEscrowStorage): string[] {
  const data = Object.values(escrow.fortunes)
  return data.map(item => item.fortune);
}

export async function processFortunes(plugins: IPlugin, fortunes: IFortuneRequest[]) {
  await Promise.all(fortunes.map(async (item) => {
    const web3 = plugins.web3[item.chainId];

    if (!web3.utils.isAddress(item.escrowAddress)) {
      throw new Error('Valid ethereum address required for escrowAddress');
    }

    if (!web3.utils.isAddress(item.workerAddress)) {
      throw new Error('Valid ethereum address required for workerAddress');
    }

    if (!item.fortune) {
      throw new Error('Non-empty fortune is required');
    }

    const recordingOracleAddress = await plugins.escrow.getRecordingOracleAddress(
      web3,
      item.escrowAddress
    );

    if (
      web3.utils.toChecksumAddress(recordingOracleAddress) !==
      web3.utils.toChecksumAddress(web3.eth.defaultAccount as string)
    ) {
      throw new Error('Escrow Recording Oracle address mismatches the current one');
    }

    const escrowStatus = await plugins.escrow.getEscrowStatus(web3, item.escrowAddress);

    if (EscrowStatus[escrowStatus] !== EscrowStatus[EscrowStatus.Pending]) {
      throw new Error('Escrow is not in the Pending status');
    }

    const manifestUrl = await plugins.escrow.getEscrowManifestUrl(web3, item.escrowAddress);
 
    const {
      fortunes_requested: fortunesRequested,
      reputation_oracle_url: reputationOracleUrl,
    } = await getManifestByUrl(manifestUrl);

    let escrow = plugins.storage.getEscrow(item.escrowAddress)

    if (!escrow) {
      escrow = plugins.storage.addEscrow(item.escrowAddress, item.chainId, fortunesRequested)
    }

    if(isFortunesRequestedDone(escrow)) {
      throw new Error('All fortunes have already been sent');
    }

    let fortune = plugins.storage.getFortune(item.escrowAddress, item.workerAddress)

    if (!fortune || (fortune && !fortune.score)) {
      let score = false;

      if (plugins.curses.isProfane(item.fortune)) {
        escrow = plugins.storage.addFortune(item.escrowAddress, item.workerAddress, item.fortune, score)
        throw new Error('Fortune contains curses');
      }

      const fortunesContent = getFortunesContent(escrow);

      if (!plugins.uniqueness.isUnique(item.fortune, fortunesContent)) {
        escrow = plugins.storage.addFortune(item.escrowAddress, item.workerAddress, item.fortune, score)
        throw new Error('Fortune is not unique');
      }

      score = (fortune && !fortune.score) ? false : true;
      escrow = plugins.storage.addFortune(item.escrowAddress, item.workerAddress, item.fortune, score)
    } else {
      throw new Error(`${item.workerAddress} already submitted a fortune`);
    }

    const fortuneResults = {
      escrowAddress: item.escrowAddress,
      chainId: escrow.chainId,
      fortunes: escrow.fortunes
    }
    const fortuneResultsUrl = await saveFortuneResults(plugins, fortuneResults);
    console.log("Fortune Results Url: ", fortuneResultsUrl)
    
    const fortuneResultsHash = crypto.createHash("sha256").update(escrow.toString()).digest("hex");;
    
    await plugins.escrow.storeResults(web3, item.escrowAddress, fortuneResultsUrl, fortuneResultsHash);

    if(isFortunesRequestedDone(escrow)) {
      sendFortunes(reputationOracleUrl, fortuneResults)
      plugins.storage.remove(item.escrowAddress);
    }
  }));

  return { response: true };
}