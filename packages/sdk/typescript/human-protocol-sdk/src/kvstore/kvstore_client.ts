import {
  KVStore,
  KVStore__factory,
} from '@human-protocol/core/typechain-types';
import { ContractRunner, ethers } from 'ethers';
import { BaseEthersClient } from '../base';
import { NETWORKS } from '../constants';
import { requiresSigner } from '../decorators';
import { ChainId } from '../enums';
import {
  ErrorInvalidAddress,
  ErrorInvalidUrl,
  ErrorKVStoreArrayLength,
  ErrorKVStoreEmptyKey,
  ErrorProviderDoesNotExist,
  ErrorUnsupportedChainID,
} from '../error';
import { NetworkData, TransactionOverrides } from '../types';
import { isValidUrl } from '../utils';
/**
 * Client for interacting with the KVStore contract.
 *
 * Internally, the SDK will use one network or another according to the network ID of the `runner`.
 * To use this client, it is recommended to initialize it using the static [`build`](/ts/classes/KVStoreClient/#build) method.
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
 * @example
 *
 * ###Using Signer
 *
 * ####Using private key (backend)
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
 * ####Using Wagmi (frontend)
 *
 * ```ts
 * import { useSigner, useChainId } from 'wagmi';
 * import { KVStoreClient } from '@human-protocol/sdk';
 *
 * const { data: signer } = useSigner();
 * const kvstoreClient = await KVStoreClient.build(signer);
 * ```
 *
 * ###Using Provider
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
  public contract: KVStore;

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
   * @returns -
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
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    if (key === '') throw ErrorKVStoreEmptyKey;
    try {
      await this.sendTxAndWait(
        (overrides) => this.contract.set(key, value, overrides),
        txOptions
      );
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
   * @returns -
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
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    if (keys.length !== values.length) throw ErrorKVStoreArrayLength;
    if (keys.includes('')) throw ErrorKVStoreEmptyKey;

    try {
      await this.sendTxAndWait(
        (overrides) => this.contract.setBulk(keys, values, overrides),
        txOptions
      );
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
   * @returns -
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
    txOptions: TransactionOverrides = {}
  ): Promise<void> {
    if (!isValidUrl(url)) {
      throw ErrorInvalidUrl;
    }

    const content = await fetch(url).then((res) => res.text());
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

    const hashKey = urlKey + '_hash';

    try {
      await this.sendTxAndWait(
        (overrides) =>
          this.contract.setBulk(
            [urlKey, hashKey],
            [url, contentHash],
            overrides
          ),
        txOptions
      );
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
