import { Provider } from '@ethersproject/abstract-provider';
import {
  KVStore,
  KVStore__factory,
} from '@human-protocol/core/typechain-types';
import { Signer, ethers } from 'ethers';
import { NETWORKS } from './constants';
import { ChainId } from './enums';
import {
  ErrorChainId,
  ErrorInvalidAddress,
  ErrorKVStoreArrayLength,
  ErrorKVStoreEmptyKey,
  ErrorKVStoreEmptyValue,
  ErrorKVStoreValueNotFound,
} from './error';

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

      if (!kvstoreAddress) return ErrorChainId;
      this.contract = KVStore__factory.connect(
        kvstoreAddress,
        this.signerOrProvider
      );
    }
  }

  public async set(key: string, value: string) {
    if (key === '') return ErrorKVStoreEmptyKey;
    if (value === '') return ErrorKVStoreEmptyValue;
    await this.init();

    try {
      await this.contract?.set(key, value);
      return null;
    } catch (e) {
      if (e instanceof Error) return Error(`Failed to set value: ${e.message}`);
    }
  }

  public async setBulk(keys: string[], values: string[]) {
    if (keys.length !== values.length) return ErrorKVStoreArrayLength;
    if (keys.includes('')) return ErrorKVStoreEmptyKey;
    if (values.includes('')) return ErrorKVStoreEmptyValue;
    await this.init();

    try {
      await this.contract?.setBulk(keys, values);
      return null;
    } catch (e) {
      if (e instanceof Error)
        return Error(`Failed to set bulk values: ${e.message}`);
    }
  }

  public async get(address: string, key: string) {
    if (key === '') return ErrorKVStoreEmptyKey;
    if (!ethers.utils.isAddress(address)) return ErrorInvalidAddress;
    await this.init();

    try {
      const result = await this.contract?.get(address, key);
      if (result === '') return ErrorKVStoreValueNotFound;
      return result;
    } catch (e) {
      if (e instanceof Error) return Error(`Failed to get value: ${e.message}`);
    }
  }
}
