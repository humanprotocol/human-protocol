import { SmartContract } from '@multiversx/sdk-core/out';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { UserSigner } from '@multiversx/sdk-wallet/out';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

type ServiceIdentity = UserSigner | Web3;

export interface EscrowContract {
  contract: Contract | SmartContract;
  networkProvider: ProxyNetworkProvider | null;
  serviceIdentity: ServiceIdentity;

  getBalance(): Promise<number>;

  bulkPayOut(
    escrowAddress: string,
    workerAddresses: string[],
    rewards: string[],
    resultsUrl: string,
    resultHash: string
  ): Promise<unknown>;

  filterAddressesToReward(addressFortunesEntries: any[]): string[];
}
