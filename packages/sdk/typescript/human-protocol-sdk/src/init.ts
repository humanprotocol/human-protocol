import { Provider } from '@ethersproject/abstract-provider';
import { Network } from '@ethersproject/networks';
import { Signer } from 'ethers';
import { NETWORKS } from './constants';
import { IClientParams } from './interfaces';
import {
  ErrorInitProviderDoesNotExist,
  ErrorInitUnsupportedChainID,
} from './error';
import { ChainId } from './enums';

export class InitClient {
  /**
   * **Get init client parameters**
   *
   * @param {string} providerOrSigner - Ethereum signer or provider
   * @returns {Promise<IClientParams>} - Init client parameters
   */
  static async getParams(
    signerOrProvider: Signer | Provider
  ): Promise<IClientParams> {
    let network: Network;
    if (signerOrProvider instanceof Signer) {
      if (!signerOrProvider.provider) throw ErrorInitProviderDoesNotExist;

      network = await signerOrProvider.provider.getNetwork();
    } else {
      network = await signerOrProvider.getNetwork();
    }

    const chainId: ChainId = network.chainId;
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorInitUnsupportedChainID;
    }

    return {
      signerOrProvider: signerOrProvider,
      network: networkData,
    };
  }
}
