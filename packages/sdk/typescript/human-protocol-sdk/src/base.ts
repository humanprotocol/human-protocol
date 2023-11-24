import { Provider } from '@ethersproject/abstract-provider';
import { Signer, ethers } from 'ethers';
import { NetworkData } from './types';
import { gasPriceAdjusted } from './utils';

/**
 * ## Introduction
 *
 * This class is used as a base class for other clients making on-chain calls.
 *
 */
export abstract class BaseEthersClient {
  protected signerOrProvider: Signer | Provider;
  protected gasPriceMultiplier?: number;
  public networkData: NetworkData;

  /**
   * **BaseClient constructor**
   *
   * @param {Signer | Provider} signerOrProvider The Signer or Provider object to interact with the Ethereum network
   * @param {NetworkData} networkData The network information required to connect to the contracts
   * @param {number | undefined} gasPriceMultiplier The multiplier to apply to the gas price
   */
  constructor(
    signerOrProvider: Signer | Provider,
    networkData: NetworkData,
    gasPriceMultiplier?: number
  ) {
    this.networkData = networkData;
    this.signerOrProvider = signerOrProvider;
    this.gasPriceMultiplier = gasPriceMultiplier;
  }

  /**
   * Adjust the gas price, and return as an option to be passed to a transaction
   *
   * @returns {Promise<{ gasPrice: BigNumber }>} Returns the gas price options
   */
  protected async gasPriceOptions(): Promise<Partial<ethers.Overrides>> {
    return this.gasPriceMultiplier
      ? {
          gasPrice: await gasPriceAdjusted(
            this.signerOrProvider,
            this.gasPriceMultiplier
          ),
        }
      : {};
  }
}
