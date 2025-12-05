import {
  KVStore,
  KVStore__factory,
} from '@human-protocol/core/typechain-types';
import { ContractRunner, Overrides, ethers } from 'ethers';
import { BaseEthersClient } from './base';
import { KVStoreKeys, NETWORKS } from './constants';
import { requiresSigner } from './decorators';
import { ChainId } from './enums';
import {
  ErrorInvalidAddress,
  ErrorInvalidHash,
  ErrorInvalidUrl,
  ErrorKVStoreArrayLength,
  ErrorKVStoreEmptyKey,
  ErrorProviderDoesNotExist,
  ErrorUnsupportedChainID,
  InvalidKeyError,
} from './error';
import { NetworkData } from './types';
import { getSubgraphUrl, customGqlFetch, isValidUrl } from './utils';
import {
  GET_KVSTORE_BY_ADDRESS_AND_KEY_QUERY,
  GET_KVSTORE_BY_ADDRESS_QUERY,
} from './graphql/queries/kvstore';
import { KVStoreData } from './graphql';
import { IKVStore, SubgraphOptions } from './interfaces';
/**
 * ## Introduction
 *
 * This client enables performing actions on KVStore contract and obtaining information from both the contracts and subgraph.
 *
 * Internally, the SDK will use one network or another according to the network ID of the `runner`.
 * To use this client, it is recommended to initialize it using the static `build` method.
 *
 * ```ts
 * static async build(runner: ContractRunner): Promise<KVStoreClient>;
 * ```
 *
 * A `Signer` or a `Provider` should be passed depending on the use case of this module:
 *
 * - **Signer**: when the user wants to use this model to send transactions calling the contract functions.
 * - **Provider**: when the user wants to use this model to get information from the contracts or subgraph.
 *
 * ## Installation
 *
 * ### npm
 * ```bash
 * npm install @human-protocol/sdk
 * ```
 *
 * ### yarn
 * ```bash
 * yarn install @human-protocol/sdk
 * ```
 *
 * ## Code example
 *
 * ### Signer
 *
 * **Using private key (backend)**
 *
 * ```ts
 * import { KVStoreClient } from '@human-protocol/sdk';
 * import { Wallet, JsonRpcProvider } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 * const privateKey = 'YOUR_PRIVATE_KEY';
 *
 * const provider = new JsonRpcProvider(rpcUrl);
 * const signer = new Wallet(privateKey, provider);
 * const kvstoreClient = await KVStoreClient.build(signer);
 * ```
 *
 * **Using Wagmi (frontend)**
 *
 * ```ts
 * import { useSigner, useChainId } from 'wagmi';
 * import { KVStoreClient } from '@human-protocol/sdk';
 *
 * const { data: signer } = useSigner();
 * const kvstoreClient = await KVStoreClient.build(signer);
 * ```
 *
 * ### Provider
 *
 * ```ts
 * import { KVStoreClient } from '@human-protocol/sdk';
 * import { JsonRpcProvider } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 *
 * const provider = new JsonRpcProvider(rpcUrl);
 * const kvstoreClient = await KVStoreClient.build(provider);
 * ```
 */

export class KVStoreClient extends BaseEthersClient {
  private contract: KVStore;

  /**
   * **KVStoreClient constructor**
   *
   * @param runner - The Runner object to interact with the Ethereum network
   * @param networkData - The network information required to connect to the KVStore contract
   */
  constructor(runner: ContractRunner, networkData: NetworkData) {
    super(runner, networkData);

    this.contract = KVStore__factory.connect(
      networkData.kvstoreAddress,
      runner
    );
  }

  /**
   * Creates an instance of KVStoreClient from a runner.
   *
   * @param runner - The Runner object to interact with the Ethereum network
   * @returns An instance of KVStoreClient
   * @throws ErrorProviderDoesNotExist If the provider does not exist for the provided Signer
   * @throws ErrorUnsupportedChainID If the network's chainId is not supported
   *
   * @example
   * ```ts
   * import { KVStoreClient } from '@human-protocol/sdk';
   * import { Wallet, JsonRpcProvider } from 'ethers';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY';
   *
   * const provider = new JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const kvstoreClient = await KVStoreClient.build(signer);
   * ```
   */
  public static async build(runner: ContractRunner): Promise<KVStoreClient> {
    if (!runner.provider) {
      throw ErrorProviderDoesNotExist;
    }

    const network = await runner.provider?.getNetwork();

    const chainId: ChainId = Number(network?.chainId);
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    return new KVStoreClient(runner, networkData);
  }

  /**
   * This function sets a key-value pair associated with the address that submits the transaction.
   *
   * @param key - Key of the key-value pair
   * @param value - Value of the key-value pair
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @throws ErrorKVStoreEmptyKey If the key is empty
   * @throws Error If the transaction fails
   *
   * @example
   * ```ts
   * await kvstoreClient.set('Role', 'RecordingOracle');
   * ```
   */
  @requiresSigner
  public async set(
    key: string,
    value: string,
    txOptions: Overrides = {}
  ): Promise<void> {
    if (key === '') throw ErrorKVStoreEmptyKey;
    try {
      await (await this.contract.set(key, value, txOptions)).wait();
    } catch (e) {
      if (e instanceof Error) throw Error(`Failed to set value: ${e.message}`);
    }
  }

  /**
   * This function sets key-value pairs in bulk associated with the address that submits the transaction.
   *
   * @param keys - Array of keys (keys and value must have the same order)
   * @param values - Array of values
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @throws ErrorKVStoreArrayLength If keys and values arrays have different lengths
   * @throws ErrorKVStoreEmptyKey If any key is empty
   * @throws Error If the transaction fails
   *
   * @example
   * ```ts
   * const keys = ['role', 'webhook_url'];
   * const values = ['RecordingOracle', 'http://localhost'];
   * await kvstoreClient.setBulk(keys, values);
   * ```
   */
  @requiresSigner
  public async setBulk(
    keys: string[],
    values: string[],
    txOptions: Overrides = {}
  ): Promise<void> {
    if (keys.length !== values.length) throw ErrorKVStoreArrayLength;
    if (keys.includes('')) throw ErrorKVStoreEmptyKey;

    try {
      await (await this.contract.setBulk(keys, values, txOptions)).wait();
    } catch (e) {
      if (e instanceof Error)
        throw Error(`Failed to set bulk values: ${e.message}`);
    }
  }

  /**
   * Sets a URL value for the address that submits the transaction, and its hash.
   *
   * @param url - URL to set
   * @param urlKey - Configurable URL key. `url` by default.
   * @param txOptions - Additional transaction parameters (optional, defaults to an empty object).
   * @throws ErrorInvalidUrl If the URL is invalid
   * @throws Error If the transaction fails
   *
   * @example
   * ```ts
   * await kvstoreClient.setFileUrlAndHash('example.com');
   * await kvstoreClient.setFileUrlAndHash('linkedin.com/example', 'linkedin_url');
   * ```
   */
  @requiresSigner
  public async setFileUrlAndHash(
    url: string,
    urlKey = 'url',
    txOptions: Overrides = {}
  ): Promise<void> {
    if (!isValidUrl(url)) {
      throw ErrorInvalidUrl;
    }

    const content = await fetch(url).then((res) => res.text());
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

    const hashKey = urlKey + '_hash';

    try {
      await (
        await this.contract.setBulk(
          [urlKey, hashKey],
          [url, contentHash],
          txOptions
        )
      ).wait();
    } catch (e) {
      if (e instanceof Error)
        throw Error(`Failed to set URL and hash: ${e.message}`);
    }
  }
  /**
   * Gets the value of a key-value pair in the contract.
   *
   * @param address - Address from which to get the key value.
   * @param key - Key to obtain the value.
   * @returns Value of the key.
   * @throws ErrorKVStoreEmptyKey If the key is empty
   * @throws ErrorInvalidAddress If the address is invalid
   * @throws Error If the contract call fails
   *
   * @example
   * ```ts
   * const value = await kvstoreClient.get('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'Role');
   * console.log('Value:', value);
   * ```
   */
  public async get(address: string, key: string): Promise<string> {
    if (key === '') throw ErrorKVStoreEmptyKey;
    if (!ethers.isAddress(address)) throw ErrorInvalidAddress;

    try {
      const result = await this.contract?.get(address, key);
      return result;
    } catch (e) {
      if (e instanceof Error) throw Error(`Failed to get value: ${e.message}`);
      return e;
    }
  }
}

/**
 * Utility class for KVStore-related operations.
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
