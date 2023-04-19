import { Provider } from '@ethersproject/abstract-provider';
import {
  KVStore,
  KVStore__factory,
} from '@human-protocol/core/typechain-types';
import { Signer, ethers } from 'ethers';
import { NETWORKS } from './constants';
import { ChainId } from './enums';

export default class KVStoreClient {
  private signerOrProvider: Signer | Provider;
  private contract?: KVStore;

  /**
   * **KVStore constructor**
   *
   * @param {Signer | Provider} signerOrProvider - Ethereum Signer or Provider
   */
  constructor(signerOrProvider: Signer | Provider) {
    this.signerOrProvider = signerOrProvider;
  }

  private async init() {
    let chainId: ChainId;
    if (!this.contract) {
      if (this.signerOrProvider instanceof Signer)
        chainId = await this.signerOrProvider.getChainId();
      else chainId = (await this.signerOrProvider.getNetwork()).chainId;
      const kvstoreAddress = NETWORKS[chainId]?.kvstoreAddress;

      if (!kvstoreAddress) throw new Error('ChainId not supported');
      this.contract = KVStore__factory.connect(
        kvstoreAddress,
        this.signerOrProvider
      );
    }
  }

  public async set(key: string, value: string) {
    if (key === '' || value === '') return Error('Values can not be empty');
    await this.init();

    try {
      this.contract?.set(key, value);
      return null;
    } catch (e) {
      return Error(e);
    }
  }

  public async setBulk(keys: string[], values: string[]) {
    if (keys.length !== values.length)
      return Error('Arrays must have the same length');
    if (keys.includes('') || values.includes(''))
      return Error('Values can not be empty');
    await this.init();

    try {
      this.contract?.setBulk(keys, values);
      return null;
    } catch (e) {
      return Error(e);
    }
  }

  public async get(address: string, key: string) {
    if (key === '') return Error('Key can not be empty');
    if (!ethers.utils.isAddress(address)) return Error('Address not valid');
    await this.init();

    try {
      return this.contract?.get(address, key);
    } catch (e) {
      return Error(e);
    }
  }
}
