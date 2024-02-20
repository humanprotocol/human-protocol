[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [kvstore](../modules/kvstore.md) / KVStoreClient

# Class: KVStoreClient

[kvstore](../modules/kvstore.md).KVStoreClient

## Introduction

This client enables to perform actions on KVStore contract and obtain information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the `runner`.
To use this client, it is recommended to initialize it using the static `build` method.

```ts
static async build(runner: ContractRunner);
```

A `Signer` or a `Provider` should be passed depending on the use case of this module:

- **Signer**: when the user wants to use this model in order to send transactions caling the contract functions.
- **Provider**: when the user wants to use this model in order to get information from the contracts or subgraph.

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

**Using private key(backend)**

```ts
import { KVStoreClient } from '@human-protocol/sdk';
import { Wallet, providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const kvstoreClient = await KVStoreClient.build(signer);
```

**Using Wagmi(frontend)**

```ts
import { useSigner, useChainId } from 'wagmi';
import { KVStoreClient } from '@human-protocol/sdk';

const { data: signer } = useSigner();
const kvstoreClient = await KVStoreClient.build(signer);
```

### Provider

```ts
import { KVStoreClient } from '@human-protocol/sdk';
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const kvstoreClient = await KVStoreClient.build(signer);
```

## Hierarchy

- [`BaseEthersClient`](base.BaseEthersClient.md)

  ↳ **`KVStoreClient`**

## Table of contents

### Constructors

- [constructor](kvstore.KVStoreClient.md#constructor)

### Properties

- [contract](kvstore.KVStoreClient.md#contract)
- [networkData](kvstore.KVStoreClient.md#networkdata)
- [runner](kvstore.KVStoreClient.md#runner)

### Methods

- [get](kvstore.KVStoreClient.md#get)
- [getURL](kvstore.KVStoreClient.md#geturl)
- [set](kvstore.KVStoreClient.md#set)
- [setBulk](kvstore.KVStoreClient.md#setbulk)
- [setURL](kvstore.KVStoreClient.md#seturl)
- [build](kvstore.KVStoreClient.md#build)

## Constructors

### constructor

• **new KVStoreClient**(`runner`, `networkData`): [`KVStoreClient`](kvstore.KVStoreClient.md)

**KVStoreClient constructor**

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |
| `networkData` | `NetworkData` | - |

#### Returns

[`KVStoreClient`](kvstore.KVStoreClient.md)

#### Overrides

[BaseEthersClient](base.BaseEthersClient.md).[constructor](base.BaseEthersClient.md#constructor)

#### Defined in

[kvstore.ts:100](https://github.com/humanprotocol/human-protocol/blob/87747676/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L100)

## Properties

### contract

• `Private` **contract**: `KVStore`

#### Defined in

[kvstore.ts:92](https://github.com/humanprotocol/human-protocol/blob/87747676/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L92)

___

### networkData

• **networkData**: `NetworkData`

#### Inherited from

[BaseEthersClient](base.BaseEthersClient.md).[networkData](base.BaseEthersClient.md#networkdata)

#### Defined in

[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/87747676/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)

___

### runner

• `Protected` **runner**: `ContractRunner`

#### Inherited from

[BaseEthersClient](base.BaseEthersClient.md).[runner](base.BaseEthersClient.md#runner)

#### Defined in

[base.ts:11](https://github.com/humanprotocol/human-protocol/blob/87747676/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)

## Methods

### get

▸ **get**(`address`, `key`): `Promise`\<`string`\>

This function returns the value for a specified key and address.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | Address from which to get the key value. |
| `key` | `string` | Key to obtain the value. |

#### Returns

`Promise`\<`string`\>

Value of the key.

**Code example**

> Need to have available stake.

```ts
import { providers } from 'ethers';
import { KVStoreClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const kvstoreClient = await KVStoreClient.build(provider);

const value = await kvstoreClient.get('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'Role');
```

#### Defined in

[kvstore.ts:301](https://github.com/humanprotocol/human-protocol/blob/87747676/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L301)

___

### getURL

▸ **getURL**(`address`, `urlKey?`): `Promise`\<`string`\>

This function returns the URL value for the given entity.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `address` | `string` | `undefined` | Address from which to get the URL value. |
| `urlKey` | `string` | `'url'` | Configurable URL key. `url` by default. |

#### Returns

`Promise`\<`string`\>

URL value for the given address if exists, and the content is valid

**Code example**

```ts
import { providers } from 'ethers';
import { KVStoreClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const kvstoreClient = await KVStoreClient.build(provider);

const url = await kvstoreClient.getURL('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
const linkedinUrl = await kvstoreClient.getURL(
   '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   'linkedinUrl'
);
```

#### Defined in

[kvstore.ts:340](https://github.com/humanprotocol/human-protocol/blob/87747676/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L340)

___

### set

▸ **set**(`key`, `value`, `txOptions?`): `Promise`\<`void`\>

This function sets a key-value pair associated with the address that submits the transaction.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | Key of the key-value pair |
| `value` | `string` | Value of the key-value pair |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

> Need to have available stake.

```ts
import { Wallet, providers } from 'ethers';
import { KVStoreClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const kvstoreClient = await KVStoreClient.build(signer);

await kvstoreClient.set('Role', 'RecordingOracle');
```

#### Defined in

[kvstore.ts:163](https://github.com/humanprotocol/human-protocol/blob/87747676/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L163)

___

### setBulk

▸ **setBulk**(`keys`, `values`, `txOptions?`): `Promise`\<`void`\>

This function sets key-value pairs in bulk associated with the address that submits the transaction.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `keys` | `string`[] | Array of keys (keys and value must have the same order) |
| `values` | `string`[] | Array of values |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

> Need to have available stake.

```ts
import { Wallet, providers } from 'ethers';
import { KVStoreClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const kvstoreClient = await KVStoreClient.build(signer);

const keys = ['role', 'webhookUrl'];
const values = ['RecordingOracle', 'http://localhost'];
await kvstoreClient.set(keys, values);
```

#### Defined in

[kvstore.ts:206](https://github.com/humanprotocol/human-protocol/blob/87747676/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L206)

___

### setURL

▸ **setURL**(`url`, `urlKey?`, `txOptions?`): `Promise`\<`void`\>

This function sets a URL value for the address that submits the transaction.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `url` | `string` | `undefined` | URL to set |
| `urlKey` | `string` | `'url'` | Configurable URL key. `url` by default. |
| `txOptions?` | `Overrides` | `{}` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { Wallet, providers } from 'ethers';
import { KVStoreClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const kvstoreClient = await KVStoreClient.build(signer);

await kvstoreClient.setURL('example.com');
await kvstoreClient.setURL('linkedin.com/example', 'linkedinUrl);
```

#### Defined in

[kvstore.ts:249](https://github.com/humanprotocol/human-protocol/blob/87747676/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L249)

___

### build

▸ **build**(`runner`): `Promise`\<[`KVStoreClient`](kvstore.KVStoreClient.md)\>

Creates an instance of KVStoreClient from a runner.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |

#### Returns

`Promise`\<[`KVStoreClient`](kvstore.KVStoreClient.md)\>

- An instance of KVStoreClient

**`Throws`**

- Thrown if the provider does not exist for the provided Signer

**`Throws`**

- Thrown if the network's chainId is not supported

#### Defined in

[kvstore.ts:118](https://github.com/humanprotocol/human-protocol/blob/87747676/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L118)
