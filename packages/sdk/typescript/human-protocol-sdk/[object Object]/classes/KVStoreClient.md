## Introduction

This client enables performing actions on KVStore contract and obtaining information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the `runner`.
To use this client, it is recommended to initialize it using the static `build` method.

```ts
static async build(runner: ContractRunner): Promise<KVStoreClient>;
```

A `Signer` or a `Provider` should be passed depending on the use case of this module:

- **Signer**: when the user wants to use this model to send transactions calling the contract functions.
- **Provider**: when the user wants to use this model to get information from the contracts or subgraph.

## Installation

### npm
```bash
npm install @human-protocol/sdk
```

### yarn
```bash
yarn install @human-protocol/sdk
```

## Code example

### Signer

**Using private key (backend)**

```ts
import { KVStoreClient } from '@human-protocol/sdk';
import { Wallet, JsonRpcProvider } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const kvstoreClient = await KVStoreClient.build(signer);
```

**Using Wagmi (frontend)**

```ts
import { useSigner, useChainId } from 'wagmi';
import { KVStoreClient } from '@human-protocol/sdk';

const { data: signer } = useSigner();
const kvstoreClient = await KVStoreClient.build(signer);
```

### Provider

```ts
import { KVStoreClient } from '@human-protocol/sdk';
import { JsonRpcProvider } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new JsonRpcProvider(rpcUrl);
const kvstoreClient = await KVStoreClient.build(provider);
```

## Extends

- `BaseEthersClient`

## Constructors

### Constructor

```ts
new KVStoreClient(runner: ContractRunner, networkData: NetworkData): KVStoreClient;
```

**KVStoreClient constructor**

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |
| `networkData` | [`NetworkData`](../type-aliases/NetworkData.md) | The network information required to connect to the KVStore contract |

#### Returns

`KVStoreClient`

#### Overrides

```ts
BaseEthersClient.constructor
```

## Methods

### build()

```ts
static build(runner: ContractRunner): Promise<KVStoreClient>;
```

Creates an instance of KVStoreClient from a runner.

#### Throws

ErrorProviderDoesNotExist If the provider does not exist for the provided Signer

#### Throws

ErrorUnsupportedChainID If the network's chainId is not supported

#### Example

```ts
import { KVStoreClient } from '@human-protocol/sdk';
import { Wallet, JsonRpcProvider } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const kvstoreClient = await KVStoreClient.build(signer);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |

#### Returns

`Promise`\<`KVStoreClient`\>

An instance of KVStoreClient

***

### set()

```ts
set(
   key: string, 
   value: string, 
txOptions: Overrides): Promise<void>;
```

This function sets a key-value pair associated with the address that submits the transaction.

#### Throws

ErrorKVStoreEmptyKey If the key is empty

#### Throws

Error If the transaction fails

#### Example

```ts
await kvstoreClient.set('Role', 'RecordingOracle');
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | Key of the key-value pair |
| `value` | `string` | Value of the key-value pair |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### setBulk()

```ts
setBulk(
   keys: string[], 
   values: string[], 
txOptions: Overrides): Promise<void>;
```

This function sets key-value pairs in bulk associated with the address that submits the transaction.

#### Throws

ErrorKVStoreArrayLength If keys and values arrays have different lengths

#### Throws

ErrorKVStoreEmptyKey If any key is empty

#### Throws

Error If the transaction fails

#### Example

```ts
const keys = ['role', 'webhook_url'];
const values = ['RecordingOracle', 'http://localhost'];
await kvstoreClient.setBulk(keys, values);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `keys` | `string`[] | Array of keys (keys and value must have the same order) |
| `values` | `string`[] | Array of values |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### setFileUrlAndHash()

```ts
setFileUrlAndHash(
   url: string, 
   urlKey: string, 
txOptions: Overrides): Promise<void>;
```

Sets a URL value for the address that submits the transaction, and its hash.

#### Throws

ErrorInvalidUrl If the URL is invalid

#### Throws

Error If the transaction fails

#### Example

```ts
await kvstoreClient.setFileUrlAndHash('example.com');
await kvstoreClient.setFileUrlAndHash('linkedin.com/example', 'linkedin_url');
```

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `url` | `string` | `undefined` | URL to set |
| `urlKey` | `string` | `'url'` | Configurable URL key. `url` by default. |
| `txOptions` | `Overrides` | `{}` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### get()

```ts
get(address: string, key: string): Promise<string>;
```

Gets the value of a key-value pair in the contract.

#### Throws

ErrorKVStoreEmptyKey If the key is empty

#### Throws

ErrorInvalidAddress If the address is invalid

#### Throws

Error If the contract call fails

#### Example

```ts
const value = await kvstoreClient.get('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'Role');
console.log('Value:', value);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `address` | `string` | Address from which to get the key value. |
| `key` | `string` | Key to obtain the value. |

#### Returns

`Promise`\<`string`\>

Value of the key.
