import { ContractRunner } from 'ethers';
import { NetworkData } from './types';

/**
 * Base class for clients making on-chain calls.
 *
 * This class provides common functionality for interacting with Ethereum contracts.
 */
export abstract class BaseEthersClient {
  protected runner: ContractRunner;
  public networkData: NetworkData;

  /**
   * **BaseClient constructor**
   *
   * @param runner - The Signer or Provider object to interact with the Ethereum network
   * @param networkData - The network information required to connect to the contracts
   */
  constructor(runner: ContractRunner, networkData: NetworkData) {
    this.networkData = networkData;
    this.runner = runner;
  }
}
