import { ethers } from 'ethers';
import { KVStoreKeys, NETWORKS } from '../constants';
import { ChainId } from '../enums';
import {
  ErrorInvalidAddress,
  ErrorInvalidHash,
  ErrorKVStoreEmptyKey,
  ErrorUnsupportedChainID,
  InvalidKeyError,
} from '../error';
import { KVStoreData } from '../graphql';
import {
  GET_KVSTORE_BY_ADDRESS_AND_KEY_QUERY,
  GET_KVSTORE_BY_ADDRESS_QUERY,
} from '../graphql/queries/kvstore';
import { IKVStore, SubgraphOptions } from '../interfaces';
import { customGqlFetch, getSubgraphUrl } from '../utils';
/**
 * Utility helpers for KVStore-related queries.
 *
 * @example
 * ```ts
 * import { ChainId, KVStoreUtils } from '@human-protocol/sdk';
 *
 * const kvStoreData = await KVStoreUtils.getKVStoreData(
 *   ChainId.POLYGON_AMOY,
 *   "0x1234567890123456789012345678901234567890"
 * );
 * console.log('KVStore data:', kvStoreData);
 * ```
 */
export class KVStoreUtils {
  /**
   * This function returns the KVStore data for a given address.
   *
   * @param chainId - Network in which the KVStore is deployed
   * @param address - Address of the KVStore
   * @param options - Optional configuration for subgraph requests.
   * @returns KVStore data
   * @throws ErrorUnsupportedChainID If the network's chainId is not supported
   * @throws ErrorInvalidAddress If the address is invalid
   *
   * @example
   * ```ts
   * const kvStoreData = await KVStoreUtils.getKVStoreData(
   *   ChainId.POLYGON_AMOY,
   *   "0x1234567890123456789012345678901234567890"
   * );
   * console.log('KVStore data:', kvStoreData);
   * ```
   */
  public static async getKVStoreData(
    chainId: ChainId,
    address: string,
    options?: SubgraphOptions
  ): Promise<IKVStore[]> {
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    if (address && !ethers.isAddress(address)) {
      throw ErrorInvalidAddress;
    }

    const { kvstores } = await customGqlFetch<{ kvstores: KVStoreData[] }>(
      getSubgraphUrl(networkData),
      GET_KVSTORE_BY_ADDRESS_QUERY(),
      { address: address.toLowerCase() },
      options
    );

    const kvStoreData = kvstores.map((item) => ({
      key: item.key,
      value: item.value,
    }));

    return kvStoreData || [];
  }

  /**
   * Gets the value of a key-value pair in the KVStore using the subgraph.
   *
   * @param chainId - Network in which the KVStore is deployed
   * @param address - Address from which to get the key value.
   * @param key - Key to obtain the value.
   * @param options - Optional configuration for subgraph requests.
   * @returns Value of the key.
   * @throws ErrorUnsupportedChainID If the network's chainId is not supported
   * @throws ErrorInvalidAddress If the address is invalid
   * @throws ErrorKVStoreEmptyKey If the key is empty
   * @throws InvalidKeyError If the key is not found
   *
   * @example
   * ```ts
   * const value = await KVStoreUtils.get(
   *   ChainId.POLYGON_AMOY,
   *   '0x1234567890123456789012345678901234567890',
   *   'role'
   * );
   * console.log('Value:', value);
   * ```
   */
  public static async get(
    chainId: ChainId,
    address: string,
    key: string,
    options?: SubgraphOptions
  ): Promise<string> {
    if (key === '') throw ErrorKVStoreEmptyKey;
    if (!ethers.isAddress(address)) throw ErrorInvalidAddress;

    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    const { kvstores } = await customGqlFetch<{ kvstores: KVStoreData[] }>(
      getSubgraphUrl(networkData),
      GET_KVSTORE_BY_ADDRESS_AND_KEY_QUERY(),
      { address: address.toLowerCase(), key },
      options
    );

    if (!kvstores || kvstores.length === 0) {
      throw new InvalidKeyError(key, address);
    }

    return kvstores[0].value;
  }

  /**
   * Gets the URL value of the given entity, and verifies its hash.
   *
   * @param chainId - Network in which the KVStore is deployed
   * @param address - Address from which to get the URL value.
   * @param urlKey - Configurable URL key. `url` by default.
   * @param options - Optional configuration for subgraph requests.
   * @returns URL value for the given address if it exists, and the content is valid
   * @throws ErrorInvalidAddress If the address is invalid
   * @throws ErrorInvalidHash If the hash verification fails
   * @throws Error If fetching URL or hash fails
   *
   * @example
   * ```ts
   * const url = await KVStoreUtils.getFileUrlAndVerifyHash(
   *   ChainId.POLYGON_AMOY,
   *   '0x1234567890123456789012345678901234567890'
   * );
   * console.log('Verified URL:', url);
   * ```
   */
  public static async getFileUrlAndVerifyHash(
    chainId: ChainId,
    address: string,
    urlKey = 'url',
    options?: SubgraphOptions
  ): Promise<string> {
    if (!ethers.isAddress(address)) throw ErrorInvalidAddress;
    const hashKey = urlKey + '_hash';

    let url = '',
      hash = '';

    try {
      url = await this.get(chainId, address, urlKey, options);
    } catch (e) {
      if (e instanceof Error) throw Error(`Failed to get URL: ${e.message}`);
    }

    // Return empty string
    if (!url?.length) {
      return '';
    }

    try {
      hash = await this.get(chainId, address, hashKey);
    } catch (e) {
      if (e instanceof Error) throw Error(`Failed to get Hash: ${e.message}`);
    }

    const content = await fetch(url).then((res) => res.text());
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

    const formattedHash = hash?.replace(/^0x/, '');
    const formattedContentHash = contentHash?.replace(/^0x/, '');

    if (formattedHash !== formattedContentHash) {
      throw ErrorInvalidHash;
    }

    return url;
  }

  /**
   * Gets the public key of the given entity, and verifies its hash.
   *
   * @param chainId - Network in which the KVStore is deployed
   * @param address - Address from which to get the public key.
   * @param options - Optional configuration for subgraph requests.
   * @returns Public key for the given address if it exists, and the content is valid
   * @throws ErrorInvalidAddress If the address is invalid
   * @throws ErrorInvalidHash If the hash verification fails
   * @throws Error If fetching the public key fails
   *
   * @example
   * ```ts
   * const publicKey = await KVStoreUtils.getPublicKey(
   *   ChainId.POLYGON_AMOY,
   *   '0x1234567890123456789012345678901234567890'
   * );
   * console.log('Public key:', publicKey);
   * ```
   */
  public static async getPublicKey(
    chainId: ChainId,
    address: string,
    options?: SubgraphOptions
  ): Promise<string> {
    const publicKeyUrl = await this.getFileUrlAndVerifyHash(
      chainId,
      address,
      KVStoreKeys.publicKey,
      options
    );

    if (publicKeyUrl === '') {
      return '';
    }

    const publicKey = await fetch(publicKeyUrl).then((res) => res.text());

    return publicKey;
  }
}
