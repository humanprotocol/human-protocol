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
   * Internal helper to enrich transaction overrides with network specific defaults.
   *
   * Aurora networks use a fixed gas price. We always override any user provided
   * gasPrice with the canonical DEFAULT_AURORA_GAS_PRICE to avoid mismatches
   * or tx failures due to an unexpected value. For other networks the user
   * supplied fee parameters are left untouched.
   */
  protected applyTxDefaults(txOptions: Overrides = {}): Overrides {
    if (this.networkData.chainId === ChainId.AURORA_TESTNET) {
      return {
        ...txOptions,
        gasPrice: DEFAULT_AURORA_GAS_PRICE,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
      } as Overrides;
    }
    return txOptions;
  }
}
