import {
  KVStore,
  KVStore__factory,
} from '@human-protocol/core/typechain-types';
import { ContractRunner, Overrides, ethers } from 'ethers';
import { BaseEthersClient } from './base';
import { NETWORKS } from './constants';
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
import { NetworkData } from './types';
import { isValidUrl } from './utils';

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
   * const keys = ['role', 'webhookUrl'];
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
   * This function sets a URL value for the address that submits the transaction.
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
   * await kvstoreClient.setURL('example.com');
   * await kvstoreClient.setURL('linkedin.com/example', 'linkedinUrl);
   * ```
   */
  @requiresSigner
  public async setURL(
    url: string,
    urlKey = 'url',
    txOptions: Overrides = {}
  ): Promise<void> {
    if (!isValidUrl(url)) {
      throw ErrorInvalidUrl;
    }

    const content = await fetch(url).then((res) => res.text());
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));

    const hashKey = urlKey + 'Hash';

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
   * This function returns the value for a specified key and address.
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
   * This function returns the URL value for the given entity.
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
   * const url = await kvstoreClient.getURL('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
   * const linkedinUrl = await kvstoreClient.getURL(
   *    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   *    'linkedinUrl'
   * );
   * ```
   */
  public async getURL(address: string, urlKey = 'url'): Promise<string> {
    if (!ethers.isAddress(address)) throw ErrorInvalidAddress;
    const hashKey = urlKey + 'Hash';

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
}
