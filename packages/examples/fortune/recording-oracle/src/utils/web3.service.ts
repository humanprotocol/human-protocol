import { EscrowContract } from './contract.interface';
import { Contract } from 'web3-eth-contract';
import EscrowAbi from '@human-protocol/core/abis/Escrow.json';
import Web3 from 'web3';

const statusesMap = [
  'Launched',
  'Pending',
  'Partial',
  'Paid',
  'Complete',
  'Cancelled',
];

export class Web3Service implements EscrowContract {
  contract: Contract;
  networkProvider: null;
  web3: Web3;

  constructor(address: string, web3: Web3) {
    this.contract = new web3.eth.Contract(EscrowAbi as [], address);
    this.networkProvider = null;
    this.web3 = web3;
  }

  async getRecordingOracleAddress(): Promise<string> {
    return await this.contract.methods.recordingOracle().call();
  }

  async getEscrowStatus(): Promise<string> {
    const res = await this.contract.methods.status().call();

    return statusesMap[res];
  }

  async getEscrowManifestUrl(): Promise<string> {
    return await this.contract.methods.manifestUrl().call();
  }

  async storeResults(resultsUrl: string, resultHash: string): Promise<unknown> {
    const gasNeeded = await this.contract.methods
      .storeResults(resultsUrl, resultHash)
      .estimateGas({ from: this.web3.eth.defaultAccount });
    const gasPrice = await this.web3.eth.getGasPrice();

    const result = await this.contract.methods
      .storeResults(resultsUrl, resultHash)
      .send({ from: this.web3.eth.defaultAccount, gas: gasNeeded, gasPrice });

    return result;
  }
}

export function initWeb3(ethHttpServer: string, privKey: string): Web3 {
  const web3 = new Web3(ethHttpServer);
  const account = web3.eth.accounts.privateKeyToAccount(`0x${privKey}`);

  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;

  return web3;
}
