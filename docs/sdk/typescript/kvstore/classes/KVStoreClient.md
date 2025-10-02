[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [kvstore](../README.md) / KVStoreClient

# Class: KVStoreClient

Defined in: [kvstore.ts:99](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L99)

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
import { Wallet, providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
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
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const kvstoreClient = await KVStoreClient.build(provider);
```

## Extends

- [`BaseEthersClient`](../../base/classes/BaseEthersClient.md)

## Constructors

### Constructor

> **new KVStoreClient**(`runner`, `networkData`): `KVStoreClient`

Defined in: [kvstore.ts:108](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L108)

**KVStoreClient constructor**

#### Parameters

##### runner

`ContractRunner`

The Runner object to interact with the Ethereum network

##### networkData

[`NetworkData`](../../types/type-aliases/NetworkData.md)

The network information required to connect to the KVStore contract

#### Returns

`KVStoreClient`

#### Overrides

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`constructor`](../../base/classes/BaseEthersClient.md#constructor)

## Properties

### networkData

> **networkData**: [`NetworkData`](../../types/type-aliases/NetworkData.md)

Defined in: [base.ts:14](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L14)

#### Inherited from

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`networkData`](../../base/classes/BaseEthersClient.md#networkdata)

***

### runner

> `protected` **runner**: `ContractRunner`

Defined in: [base.ts:13](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L13)

#### Inherited from

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`runner`](../../base/classes/BaseEthersClient.md#runner)

## Methods

### applyTxDefaults()

> `protected` **applyTxDefaults**(`txOptions`): `Overrides`

Defined in: [base.ts:35](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L35)

Internal helper to enrich transaction overrides with network specific defaults.

Aurora networks use a fixed gas price. We always override any user provided
gasPrice with the canonical DEFAULT_AURORA_GAS_PRICE to avoid mismatches
or tx failures due to an unexpected value. For other networks the user
supplied fee parameters are left untouched.

#### Parameters

##### txOptions

`Overrides` = `{}`

#### Returns

`Overrides`

#### Inherited from

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`applyTxDefaults`](../../base/classes/BaseEthersClient.md#applytxdefaults)

***

### get()

> **get**(`address`, `key`): `Promise`\<`string`\>

Defined in: [kvstore.ts:316](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L316)

Gets the value of a key-value pair in the contract.

#### Parameters

##### address

`string`

Address from which to get the key value.

##### key

`string`

Key to obtain the value.

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

***

### set()

> **set**(`key`, `value`, `txOptions?`): `Promise`\<`void`\>

Defined in: [kvstore.ts:171](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L171)

This function sets a key-value pair associated with the address that submits the transaction.

#### Parameters

##### key

`string`

Key of the key-value pair

##### value

`string`

Value of the key-value pair

##### txOptions?

`Overrides` = `{}`

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
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const kvstoreClient = await KVStoreClient.build(signer);

await kvstoreClient.set('Role', 'RecordingOracle');
```

***

### setBulk()

> **setBulk**(`keys`, `values`, `txOptions?`): `Promise`\<`void`\>

Defined in: [kvstore.ts:216](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L216)

This function sets key-value pairs in bulk associated with the address that submits the transaction.

#### Parameters

##### keys

`string`[]

Array of keys (keys and value must have the same order)

##### values

`string`[]

Array of values

##### txOptions?

`Overrides` = `{}`

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
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const kvstoreClient = await KVStoreClient.build(signer);

const keys = ['role', 'webhook_url'];
const values = ['RecordingOracle', 'http://localhost'];
await kvstoreClient.setBulk(keys, values);
```

***

### setFileUrlAndHash()

> **setFileUrlAndHash**(`url`, `urlKey`, `txOptions?`): `Promise`\<`void`\>

Defined in: [kvstore.ts:265](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L265)

Sets a URL value for the address that submits the transaction, and its hash.

#### Parameters

##### url

`string`

URL to set

##### urlKey

`string` = `'url'`

Configurable URL key. `url` by default.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { Wallet, providers } from 'ethers';
import { KVStoreClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const kvstoreClient = await KVStoreClient.build(signer);

await kvstoreClient.setFileUrlAndHash('example.com');
await kvstoreClient.setFileUrlAndHash('linkedin.com/example', 'linkedin_url');
```

***

### build()

> `static` **build**(`runner`): `Promise`\<`KVStoreClient`\>

Defined in: [kvstore.ts:126](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L126)

Creates an instance of KVStoreClient from a runner.

#### Parameters

##### runner

`ContractRunner`

The Runner object to interact with the Ethereum network

#### Returns

`Promise`\<`KVStoreClient`\>

- An instance of KVStoreClient

#### Throws

- Thrown if the provider does not exist for the provided Signer

#### Throws

- Thrown if the network's chainId is not supported
