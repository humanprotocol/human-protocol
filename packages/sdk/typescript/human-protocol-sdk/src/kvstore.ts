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
} from './error';
import gqlFetch from 'graphql-request';
import { NetworkData } from './types';
import { getSubgraphUrl, isValidUrl } from './utils';
import { GET_KVSTORE_BY_ADDRESS_QUERY } from './graphql/queries/kvstore';
import { KVStoreData } from './graphql';
import { IKVStore } from './interfaces';
/**
 * ## Introduction
 *
 * This client enables to perform actions on KVStore contract and obtain information from both the contracts and subgraph.
 *
 * Internally, the SDK will use one network or another according to the network ID of the `runner`.
 * To use this client, it is recommended to initialize it using the static `build` method.
 *
 * ```ts
 * static async build(runner: ContractRunner);
 * ```
 *
 * A `Signer` or a `Provider` should be passed depending on the use case of this module:
 *
 * - **Signer**: when the user wants to use this model in order to send transactions caling the contract functions.
 * - **Provider**: when the user wants to use this model in order to get information from the contracts or subgraph.
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
 * **Using private key(backend)**
 *
 * ```ts
 * import { KVStoreClient } from '@human-protocol/sdk';
 * import { Wallet, providers } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 * const privateKey = 'YOUR_PRIVATE_KEY'
 *
 * const provider = new providers.JsonRpcProvider(rpcUrl);
 * const signer = new Wallet(privateKey, provider);
 * const kvstoreClient = await KVStoreClient.build(signer);
 * ```
 *
 * **Using Wagmi(frontend)**
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
 * import { providers } from 'ethers';
 *
 * const rpcUrl = 'YOUR_RPC_URL';
 *
 * const provider = new providers.JsonRpcProvider(rpcUrl);
 * const kvstoreClient = await KVStoreClient.build(signer);
 * ```
 */

export class KVStoreClient extends BaseEthersClient {
  private contract: KVStore;

  /**
   * **KVStoreClient constructor**
   *
   * @param {ContractRunner} runner - The Runner object to interact with the Ethereum network
   * @param {NetworkData} network - The network information required to connect to the KVStore contract
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
   * @param {ContractRunner} runner - The Runner object to interact with the Ethereum network
   *
   * @returns {Promise<KVStoreClient>} - An instance of KVStoreClient
   * @throws {ErrorProviderDoesNotExist} - Thrown if the provider does not exist for the provided Signer
   * @throws {ErrorUnsupportedChainID} - Thrown if the network's chainId is not supported
   */
  public static async build(runner: ContractRunner) {
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
   * @param {string} key Key of the key-value pair
   * @param {string} value Value of the key-value pair
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Need to have available stake.
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { KVStoreClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const kvstoreClient = await KVStoreClient.build(signer);
   *
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
   * @param {string[]} keys Array of keys (keys and value must have the same order)
   * @param {string[]} values Array of values
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * > Need to have available stake.
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { KVStoreClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const kvstoreClient = await KVStoreClient.build(signer);
   *
   * const keys = ['role', 'webhook_url'];
   * const values = ['RecordingOracle', 'http://localhost'];
   * await kvstoreClient.set(keys, values);
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
   * @param {string} url URL to set
   * @param {string | undefined} urlKey Configurable URL key. `url` by default.
   * @param {Overrides} [txOptions] - Additional transaction parameters (optional, defaults to an empty object).
   * @returns Returns void if successful. Throws error if any.
   *
   *
   * **Code example**
   *
   * ```ts
   * import { Wallet, providers } from 'ethers';
   * import { KVStoreClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   * const privateKey = 'YOUR_PRIVATE_KEY'
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const signer = new Wallet(privateKey, provider);
   * const kvstoreClient = await KVStoreClient.build(signer);
   *
   * await kvstoreClient.setFileUrlAndHash('example.com');
   * await kvstoreClient.setFileUrlAndHash('linkedin.com/example', 'linkedin_url);
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
   * @param {string} address Address from which to get the key value.
   * @param {string} key Key to obtain the value.
   * @returns {string} Value of the key.
   *
   *
   * **Code example**
   *
   * > Need to have available stake.
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { KVStoreClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const kvstoreClient = await KVStoreClient.build(provider);
   *
   * const value = await kvstoreClient.get('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'Role');
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

  /**
   * Gets the URL value of the given entity, and verify its hash.
   *
   * @param {string} address Address from which to get the URL value.
   * @param {string} urlKey  Configurable URL key. `url` by default.
   * @returns {string} URL value for the given address if exists, and the content is valid
   *
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { KVStoreClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const kvstoreClient = await KVStoreClient.build(provider);
   *
   * const url = await kvstoreClient.getFileUrlAndVerifyHash('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
   * const linkedinUrl = await kvstoreClient.getFileUrlAndVerifyHash(
   *    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    'linkedin_url'
   * );
   * ```
   */
  public async getFileUrlAndVerifyHash(
    address: string,
    urlKey = 'url'
  ): Promise<string> {
    if (!ethers.isAddress(address)) throw ErrorInvalidAddress;
    const hashKey = urlKey + '_hash';

    let url = '',
      hash = '';

    try {
      url = await this.contract?.get(address, urlKey);
    } catch (e) {
      if (e instanceof Error) throw Error(`Failed to get URL: ${e.message}`);
    }

    // Return empty string
    if (!url?.length) {
      return '';
    }

    try {
      hash = await this.contract?.get(address, hashKey);
    } catch (e) {
      if (e instanceof Error) throw Error(`Failed to get Hash: ${e.message}`);
    }

    const content = await fetch(url).then((res) => res.text());
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

    if (hash !== contentHash) {
      throw ErrorInvalidHash;
    }

    return url;
  }

  /**
   * Gets the public key of the given entity, and verify its hash.
   *
   * @param {string} address Address from which to get the public key.
   * @returns {string} Public key for the given address if exists, and the content is valid
   *
   *
   * **Code example**
   *
   * ```ts
   * import { providers } from 'ethers';
   * import { KVStoreClient } from '@human-protocol/sdk';
   *
   * const rpcUrl = 'YOUR_RPC_URL';
   *
   * const provider = new providers.JsonRpcProvider(rpcUrl);
   * const kvstoreClient = await KVStoreClient.build(provider);
   *
   * const publicKey = await kvstoreClient.getPublicKey('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
   * ```
   */
  public async getPublicKey(address: string): Promise<string> {
    const publicKeyUrl = await this.getFileUrlAndVerifyHash(
      address,
      KVStoreKeys.publicKey
    );

    if (publicKeyUrl === '') {
      return '';
    }

    const publicKey = await fetch(publicKeyUrl).then((res) => res.text());

    return publicKey;
  }
}

/**
 * ## Introduction
 *
 * Utility class for KVStore-related operations.
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
 * import { ChainId, KVStoreUtils } from '@human-protocol/sdk';
 *
 * const KVStoreAddresses = new KVStoreUtils.getData({
 *   networks: [ChainId.POLYGON_AMOY]
 * });
 * ```
 */
export class KVStoreUtils {
  /**
   * This function returns the KVStore data for a given address.
   *
   * > This uses Subgraph
   *
   * **Input parameters**
   *
   * ```ts
   * enum ChainId {
   *   ALL = -1,
   *   MAINNET = 1,
   *   RINKEBY = 4,
   *   GOERLI = 5,
   *   BSC_MAINNET = 56,
   *   BSC_TESTNET = 97,
   *   POLYGON = 137,
   *   POLYGON_MUMBAI = 80001,
   *   POLYGON_AMOY = 80002,
   *   MOONBEAM = 1284,
   *   MOONBASE_ALPHA = 1287,
   *   AVALANCHE = 43114,
   *   AVALANCHE_TESTNET = 43113,
   *   CELO = 42220,
   *   CELO_ALFAJORES = 44787,
   *   LOCALHOST = 1338,
   * }
   * ```
   *
   * ```ts
   * interface IKVStore {
   *   key: string;
   *   value: string;
   * }
   * ```
   *
   * @param {ChainId} chainId Network in which the KVStore is deployed
   * @param {string} address Address of the KVStore
   * @returns {Promise<IKVStore[]>} KVStore data
   *
   * **Code example**
   *
   * ```ts
   * import { ChainId, KVStoreUtils } from '@human-protocol/sdk';
   *
   * const kvStoreData = await KVStoreUtils.getKVStoreData(ChainId.POLYGON_AMOY, "0x1234567890123456789012345678901234567890");
   * console.log(kvStoreData);
   * ```
   */
  public static async getKVStoreData(
    chainId: ChainId,
    address: string
  ): Promise<IKVStore[]> {
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    if (address && !ethers.isAddress(address)) {
      throw ErrorInvalidAddress;
    }

    const { kvstores } = await gqlFetch<{ kvstores: KVStoreData[] }>(
      getSubgraphUrl(networkData),
      GET_KVSTORE_BY_ADDRESS_QUERY(),
      { address: address.toLowerCase() }
    );

    const kvStoreData = kvstores.map((item) => ({
      key: item.key,
      value: item.value,
    }));

    return kvStoreData || [];
  }
}
