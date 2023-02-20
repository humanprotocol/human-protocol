import { SmartContract } from '@multiversx/sdk-core/out';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers/out';
import { Contract } from 'web3-eth-contract';

export interface EscrowContract {
  contract: Contract | SmartContract;
  networkProvider: ProxyNetworkProvider | null;

  /**
   * Get the recording oracle address
   */
  getRecordingOracleAddress(): Promise<string>;

  /**
   * Get the escrow status
   */
  getEscrowStatus(): Promise<string>;

  /**
   * Get the escrow manifest url
   */
  getEscrowManifestUrl(): Promise<string>;

  /**
   * Store the results
   * @param resultsUrl The url of the results json file
   * @param resultHash The hash of the results json file
   */
  storeResults(resultsUrl: string, resultHash: string): Promise<unknown>;
}
