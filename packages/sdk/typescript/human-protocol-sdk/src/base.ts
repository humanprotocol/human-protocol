import { ContractRunner, Overrides } from 'ethers';
import { NetworkData } from './types';
import { ChainId } from './enums';
import { DEFAULT_AURORA_GAS_PRICE } from './constants';

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

  /**
   * Internal helper to enrich transaction overrides with network specific defaults
   * (e.g. fixed gas price for Aurora networks) while preserving user provided
   * fee parameters.
   */
  protected applyTxDefaults(txOptions: Overrides = {}): Overrides {
    if (
      this.networkData.chainId === ChainId.AURORA_TESTNET &&
      txOptions.gasPrice === undefined
    ) {
      return { ...txOptions, gasPrice: DEFAULT_AURORA_GAS_PRICE };
    }
    return txOptions;
  }
}
