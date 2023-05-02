import {
  KVStore,
  KVStore__factory,
} from '@human-protocol/core/typechain-types';
import { ethers } from 'ethers';
import {
  ErrorInvalidAddress,
  ErrorKVStoreArrayLength,
  ErrorKVStoreEmptyKey,
  ErrorSigner,
} from './error';
import { IClientParams } from './interfaces';

export default class KVStoreClient {
  private contract: KVStore;

  /**
   * **KVStore constructor**
   *
   *   * @param {IClientParams} clientParams - Init client parameters
   */
  constructor(readonly clientParams: IClientParams) {
    this.contract = KVStore__factory.connect(
      clientParams.network.kvstoreAddress,
      clientParams.signerOrProvider
    );
  }

  /**
   * Sets a key-value pair in the contract
   *
   * @param {string} key - The key of the key-value pair to set
   * @param {string} value - The value of the key-value pair to set
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred
   */
  public async set(key: string, value: string) {
    if (!this.contract.signer) throw ErrorSigner;
    if (key === '') throw ErrorKVStoreEmptyKey;
    try {
      await this.contract?.set(key, value);
    } catch (e) {
      if (e instanceof Error) throw Error(`Failed to set value: ${e.message}`);
    }
  }

  /**
   * Sets multiple key-value pairs in the contract
   *
   * @param {string[]} keys - An array of keys to set
   * @param {string[]} values - An array of values to set
   * @returns {Promise<void>}
   * @throws {Error} - An error object if an error occurred
   */
  public async setBulk(keys: string[], values: string[]) {
    if (!this.contract.signer) throw ErrorSigner;
    if (keys.length !== values.length) throw ErrorKVStoreArrayLength;
    if (keys.includes('')) throw ErrorKVStoreEmptyKey;

    try {
      await this.contract?.setBulk(keys, values);
    } catch (e) {
      if (e instanceof Error)
        throw Error(`Failed to set bulk values: ${e.message}`);
    }
  }

  /**
   * Gets the value of a key-value pair in the contract
   *
   * @param {string} address - The Ethereum address associated with the key-value pair
   * @param {string} key - The key of the key-value pair to get
   * @returns {string} - The value of the key-value pair if it exists
   * @throws {Error} - An error object if an error occurred
   */
  public async get(address: string, key: string) {
    if (key === '') throw ErrorKVStoreEmptyKey;
    if (!ethers.utils.isAddress(address)) throw ErrorInvalidAddress;

    try {
      const result = await this.contract?.get(address, key);
      return result;
    } catch (e) {
      if (e instanceof Error) throw Error(`Failed to get value: ${e.message}`);
    }
  }
}
