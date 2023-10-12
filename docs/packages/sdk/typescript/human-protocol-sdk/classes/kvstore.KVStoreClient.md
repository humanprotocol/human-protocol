[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [kvstore](../modules/kvstore.md) / KVStoreClient

# Class: KVStoreClient

[kvstore](../modules/kvstore.md).KVStoreClient

## Introduction

This client enables to perform actions on KVStore contract and obtain information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the `signerOrProvider`.
To use this client, it is recommended to initialize it using the static `build` method.

```ts
static async build(signerOrProvider: Signer | Provider);
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

## Table of contents

### Constructors

- [constructor](kvstore.KVStoreClient.md#constructor)

### Properties

- [contract](kvstore.KVStoreClient.md#contract)
- [signerOrProvider](kvstore.KVStoreClient.md#signerorprovider)

### Methods

- [get](kvstore.KVStoreClient.md#get)
- [set](kvstore.KVStoreClient.md#set)
- [setBulk](kvstore.KVStoreClient.md#setbulk)
- [build](kvstore.KVStoreClient.md#build)

## Constructors

### constructor

• **new KVStoreClient**(`signerOrProvider`, `network`)

**KVStoreClient constructor**

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signerOrProvider` | `Signer` \| `Provider` | The Signer or Provider object to interact with the Ethereum network |
| `network` | `NetworkData` | The network information required to connect to the KVStore contract |

#### Defined in

[kvstore.ts:100](https://github.com/humanprotocol/human-protocol/blob/e24925d6/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L100)

## Properties

### contract

• `Private` **contract**: `KVStore`

#### Defined in

[kvstore.ts:91](https://github.com/humanprotocol/human-protocol/blob/e24925d6/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L91)

___

### signerOrProvider

• `Private` **signerOrProvider**: `Signer` \| `Provider`

#### Defined in

[kvstore.ts:92](https://github.com/humanprotocol/human-protocol/blob/e24925d6/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L92)

## Methods

### get

▸ **get**(`address`, `key`): `Promise`<`string`\>

This function returns the value for a specified key and address.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | Address from which to get the key value. |
| `key` | `string` | Key to obtain the value. |

#### Returns

`Promise`<`string`\>

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

[kvstore.ts:241](https://github.com/humanprotocol/human-protocol/blob/e24925d6/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L241)

___

### set

▸ **set**(`key`, `value`): `Promise`<`void`\>

This function sets a key-value pair associated with the address that submits the transaction.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `key` | `string` | Key of the key-value pair |
| `value` | `string` | Value of the key-value pair |

#### Returns

`Promise`<`void`\>

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

[kvstore.ts:165](https://github.com/humanprotocol/human-protocol/blob/e24925d6/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L165)

___

### setBulk

▸ **setBulk**(`keys`, `values`): `Promise`<`void`\>

This function sets key-value pairs in bulk associated with the address that submits the transaction.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `keys` | `string`[] | Array of keys (keys and value must have the same order) |
| `values` | `string`[] | Array of values |

#### Returns

`Promise`<`void`\>

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

const keys = ['Role', 'Webhook_url'];
const values = ['RecordingOracle', 'http://localhost'];
await kvstoreClient.set(keys, values);
```

#### Defined in

[kvstore.ts:204](https://github.com/humanprotocol/human-protocol/blob/e24925d6/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L204)

___

### build

▸ `Static` **build**(`signerOrProvider`): `Promise`<[`KVStoreClient`](kvstore.KVStoreClient.md)\>

Creates an instance of KVStoreClient from a Signer or Provider.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signerOrProvider` | `Signer` \| `Provider` | The Signer or Provider object to interact with the Ethereum network |

#### Returns

`Promise`<[`KVStoreClient`](kvstore.KVStoreClient.md)\>

- An instance of KVStoreClient

**`Throws`**

- Thrown if the provider does not exist for the provided Signer

**`Throws`**

- Thrown if the network's chainId is not supported

#### Defined in

[kvstore.ts:116](https://github.com/humanprotocol/human-protocol/blob/e24925d6/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L116)
