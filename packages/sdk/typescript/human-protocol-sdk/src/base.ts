import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from 'ethers';
import { NetworkData } from './types';

/**
 * ## Introduction
 *
 * This class is used as a base class for other clients making on-chain calls.
 *
 */
export abstract class BaseEthersClient {
  protected signerOrProvider: Signer | Provider;
  public networkData: NetworkData;

  /**
   * **BaseClient constructor**
   *
   * @param {Signer | Provider} signerOrProvider The Signer or Provider object to interact with the Ethereum network
   * @param {NetworkData} networkData The network information required to connect to the contracts
   */
  constructor(signerOrProvider: Signer | Provider, networkData: NetworkData) {
    this.networkData = networkData;
    this.signerOrProvider = signerOrProvider;
  }
}
