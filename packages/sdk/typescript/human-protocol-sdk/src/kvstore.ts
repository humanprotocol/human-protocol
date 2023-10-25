import { Provider } from '@ethersproject/abstract-provider';
import { Network } from '@ethersproject/networks';
import {
  KVStore,
  KVStore__factory,
} from '@human-protocol/core/typechain-types';
import { Signer, ethers } from 'ethers';
import { NETWORKS } from './constants';
import { requiresSigner } from './decorators';
import { ChainId } from './enums';
import {
  ErrorInvalidAddress,
  ErrorKVStoreArrayLength,
  ErrorKVStoreEmptyKey,
  ErrorProviderDoesNotExist,
  ErrorSigner,
  ErrorUnsupportedChainID,
} from './error';
import { NetworkData } from './types';

/**
 * ## Introduction
 *
 * This client enables to perform actions on KVStore contract and obtain information from both the contracts and subgraph.
 *
 * Internally, the SDK will use one network or another according to the network ID of the `signerOrProvider`.
 * To use this client, it is recommended to initialize it using the static `build` method.
 *
 * ```ts
 * static async build(signerOrProvider: Signer | Provider);
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
export class KVStoreClient {
  private contract: KVStore;
  private signerOrProvider: Signer | Provider;

  /**
   * **KVStoreClient constructor**
   *
   * @param {Signer | Provider} signerOrProvider - The Signer or Provider object to interact with the Ethereum network
   * @param {NetworkData} network - The network information required to connect to the KVStore contract
   */
  constructor(signerOrProvider: Signer | Provider, network: NetworkData) {
    this.contract = KVStore__factory.connect(
      network.kvstoreAddress,
      signerOrProvider
    );
    this.signerOrProvider = signerOrProvider;
  }

  /**
   * Creates an instance of KVStoreClient from a Signer or Provider.
   *
   * @param {Signer | Provider} signerOrProvider - The Signer or Provider object to interact with the Ethereum network
   * @returns {Promise<KVStoreClient>} - An instance of KVStoreClient
   * @throws {ErrorProviderDoesNotExist} - Thrown if the provider does not exist for the provided Signer
   * @throws {ErrorUnsupportedChainID} - Thrown if the network's chainId is not supported
   */
  public static async build(signerOrProvider: Signer | Provider) {
    let network: Network;
    if (Signer.isSigner(signerOrProvider)) {
      if (!signerOrProvider.provider) {
        throw ErrorProviderDoesNotExist;
      }

      network = await signerOrProvider.provider.getNetwork();
    } else {
      network = await signerOrProvider.getNetwork();
    }

    const chainId: ChainId = network.chainId;
    const networkData = NETWORKS[chainId];

    if (!networkData) {
      throw ErrorUnsupportedChainID;
    }

    return new KVStoreClient(signerOrProvider, networkData);
  }

  /**
   * This function sets a key-value pair associated with the address that submits the transaction.
   *
   * @param {string} key Key of the key-value pair
   * @param {string} value Value of the key-value pair
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
  public async set(key: string, value: string): Promise<void> {
    if (!Signer.isSigner(this.signerOrProvider)) throw ErrorSigner;
    if (key === '') throw ErrorKVStoreEmptyKey;
    try {
      await this.contract?.set(key, value);
    } catch (e) {
      if (e instanceof Error) throw Error(`Failed to set value: ${e.message}`);
    }
  }

  /**
   * This function sets key-value pairs in bulk associated with the address that submits the transaction.
   *
   * @param {string[]} keys Array of keys (keys and value must have the same order)
   * @param {string[]} values Array of values
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
   * const keys = ['Role', 'Webhook_url'];
   * const values = ['RecordingOracle', 'http://localhost'];
   * await kvstoreClient.set(keys, values);
   * ```
   */
  @requiresSigner
  public async setBulk(keys: string[], values: string[]): Promise<void> {
    if (!Signer.isSigner(this.signerOrProvider)) throw ErrorSigner;
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
    if (!ethers.utils.isAddress(address)) throw ErrorInvalidAddress;

    try {
      const result = await this.contract?.get(address, key);
      return result;
    } catch (e) {
      if (e instanceof Error) throw Error(`Failed to get value: ${e.message}`);
      return e;
    }
  }
}
