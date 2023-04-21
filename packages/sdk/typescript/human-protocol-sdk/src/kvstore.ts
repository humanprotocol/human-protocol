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

  /**
   * Initializes the contract instance and sets it to the `this.contract` property
   */
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

  /**
   * Sets a key-value pair in the contract
   *
   * @param {string} key - The key of the key-value pair to set
   * @param {string} value - The value of the key-value pair to set
   * @returns {Error | null} - An error object if an error occurred, null otherwise
   */
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

  /**
   * Sets multiple key-value pairs in the contract
   *
   * @param {string[]} keys - An array of keys to set
   * @param {string[]} values - An array of values to set
   * @returns {Error | null} - An error object if an error occurred, null otherwise
   */
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

  /**
   * Gets the value of a key-value pair in the contract
   *
   * @param {string} address - The Ethereum address associated with the key-value pair
   * @param {string} key - The key of the key-value pair to get
   * @returns {string | Error} - The value of the key-value pair if it exists, an error object otherwise
   */
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
