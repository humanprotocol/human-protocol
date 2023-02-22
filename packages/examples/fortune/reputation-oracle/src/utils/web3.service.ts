import { Contract } from 'web3-eth-contract';
import EscrowAbi from '@human-protocol/core/abis/Escrow.json';
import Web3 from 'web3';
import { EscrowContract } from './escrow.interface';
import { UserSigner } from '@multiversx/sdk-wallet/out';

export class Web3Service implements EscrowContract {
  contract: Contract;
  networkProvider: null;
  serviceIdentity: Web3;

  constructor(address: string, serviceIdentity: Web3) {
    this.contract = new Contract(EscrowAbi as [], address);
    this.networkProvider = null;
    this.serviceIdentity = serviceIdentity;
  }

  async getBalance(): Promise<number> {
    return Number(await this.contract.methods.getBalance().call());
  }

  async bulkPayOut(
    escrowAddress: string,
    workerAddresses: string[],
    rewards: string[],
    resultsUrl: string,
    resultHash: string
  ): Promise<void> {
    const gasNeeded = await this.contract.methods
      .bulkPayOut(workerAddresses, rewards, resultsUrl, resultHash, 1)
      .estimateGas({ from: this.serviceIdentity.defaultAccount });
    const gasPrice = await this.serviceIdentity.eth.getGasPrice();

    await this.contract.methods
      .bulkPayOut(workerAddresses, rewards, resultsUrl, resultHash, 1)
      .send({
        from: this.serviceIdentity.eth.defaultAccount,
        gas: gasNeeded,
        gasPrice,
      });
  }

  async bulkPaid(): Promise<boolean> {
    const result = await this.contract.methods.bulkPaid().call();
    return result;
  }

  filterAddressesToReward(addressFortunesEntries: any[]) {
    const filteredResults: any = [];
    const tmpHashMap: any = {};

    addressFortunesEntries.forEach((fortuneEntry) => {
      const { fortune } = fortuneEntry;
      if (tmpHashMap[fortune]) {
        return;
      }

      tmpHashMap[fortune] = true;
      filteredResults.push(fortuneEntry);
    });

    return filteredResults
      .map((fortune: { worker: any }) => fortune.worker)
      .map(this.serviceIdentity.utils.toChecksumAddress);
  }
}
