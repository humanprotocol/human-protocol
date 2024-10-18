[**@human-protocol/sdk**](../../README.md) • **Docs**

***

[@human-protocol/sdk](../../modules.md) / [kvstore](../README.md) / KVStoreClient

# Class: KVStoreClient

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

## Extends

- [`BaseEthersClient`](../../base/classes/BaseEthersClient.md)

## Constructors

### new KVStoreClient()

> **new KVStoreClient**(`runner`, `networkData`): [`KVStoreClient`](KVStoreClient.md)

**KVStoreClient constructor**

#### Parameters

• **runner**: `ContractRunner`

The Runner object to interact with the Ethereum network

• **networkData**: `NetworkData`

#### Returns

[`KVStoreClient`](KVStoreClient.md)

#### Overrides

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`constructor`](../../base/classes/BaseEthersClient.md#constructors)

#### Defined in

[kvstore.ts:108](https://github.com/humanprotocol/human-protocol/blob/95ed623c67878973c127c8529a78774329277e86/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L108)

## Properties

### networkData

> **networkData**: `NetworkData`

#### Inherited from

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`networkData`](../../base/classes/BaseEthersClient.md#networkdata)

#### Defined in

[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/95ed623c67878973c127c8529a78774329277e86/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)

***

### runner

> `protected` **runner**: `ContractRunner`

#### Inherited from

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`runner`](../../base/classes/BaseEthersClient.md#runner)

#### Defined in

[base.ts:11](https://github.com/humanprotocol/human-protocol/blob/95ed623c67878973c127c8529a78774329277e86/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)

## Methods

### set()

> **set**(`key`, `value`, `txOptions`?): `Promise`\<`void`\>

This function sets a key-value pair associated with the address that submits the transaction.

#### Parameters

• **key**: `string`

Key of the key-value pair

• **value**: `string`

Value of the key-value pair

• **txOptions?**: `Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

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

[kvstore.ts:171](https://github.com/humanprotocol/human-protocol/blob/95ed623c67878973c127c8529a78774329277e86/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L171)

***

### setBulk()

> **setBulk**(`keys`, `values`, `txOptions`?): `Promise`\<`void`\>

This function sets key-value pairs in bulk associated with the address that submits the transaction.

#### Parameters

• **keys**: `string`[]

Array of keys (keys and value must have the same order)

• **values**: `string`[]

Array of values

• **txOptions?**: `Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

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

const keys = ['role', 'webhook_url'];
const values = ['RecordingOracle', 'http://localhost'];
await kvstoreClient.set(keys, values);
```

#### Defined in

[kvstore.ts:214](https://github.com/humanprotocol/human-protocol/blob/95ed623c67878973c127c8529a78774329277e86/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L214)

***

### setFileUrlAndHash()

> **setFileUrlAndHash**(`url`, `urlKey`, `txOptions`?): `Promise`\<`void`\>

Sets a URL value for the address that submits the transaction, and its hash.

#### Parameters

• **url**: `string`

URL to set

• **urlKey**: `string` = `'url'`

Configurable URL key. `url` by default.

• **txOptions?**: `Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

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

await kvstoreClient.setFileUrlAndHash('example.com');
await kvstoreClient.setFileUrlAndHash('linkedin.com/example', 'linkedin_url);
```

#### Defined in

[kvstore.ts:257](https://github.com/humanprotocol/human-protocol/blob/95ed623c67878973c127c8529a78774329277e86/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L257)

***

### build()

> `static` **build**(`runner`): `Promise`\<[`KVStoreClient`](KVStoreClient.md)\>

Creates an instance of KVStoreClient from a runner.

#### Parameters

• **runner**: `ContractRunner`

The Runner object to interact with the Ethereum network

#### Returns

`Promise`\<[`KVStoreClient`](KVStoreClient.md)\>

- An instance of KVStoreClient

#### Throws

- Thrown if the provider does not exist for the provided Signer

#### Throws

- Thrown if the network's chainId is not supported

#### Defined in

[kvstore.ts:126](https://github.com/humanprotocol/human-protocol/blob/95ed623c67878973c127c8529a78774329277e86/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L126)
