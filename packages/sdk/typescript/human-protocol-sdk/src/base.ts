import { ContractRunner } from 'ethers';
import { NetworkData } from './types';

/**
 * ## Introduction
 *
 * This class is used as a base class for other clients making on-chain calls.
 *
 */
export abstract class BaseEthersClient {
  protected runner: ContractRunner;
  public networkData: NetworkData;

  /**
   * **BaseClient constructor**
   *
   * @param {ContractRunner} runner The Signer or Provider object to interact with the Ethereum network
   * @param {NetworkData} networkData The network information required to connect to the contracts
   */
  constructor(runner: ContractRunner, networkData: NetworkData) {
    this.networkData = networkData;
    this.runner = runner;
  }
}
