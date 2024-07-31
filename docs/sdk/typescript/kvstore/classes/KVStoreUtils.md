[**@human-protocol/sdk**](../../README.md) • **Docs**

***

[@human-protocol/sdk](../../modules.md) / [kvstore](../README.md) / KVStoreUtils

# Class: KVStoreUtils

## Introduction

Utility class for KVStore-related operations.

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
import { ChainId, KVStoreUtils } from '@human-protocol/sdk';

const KVStoreAddresses = new KVStoreUtils.getKVStoreData({
  ChainId.POLYGON_AMOY,
  "0x1234567890123456789012345678901234567890",
);
```

## Constructors

### new KVStoreUtils()

> **new KVStoreUtils**(): [`KVStoreUtils`](KVStoreUtils.md)

#### Returns

[`KVStoreUtils`](KVStoreUtils.md)

## Methods

### get()

> `static` **get**(`rpcUrl`, `address`, `key`): `Promise`\<`string`\>

Gets the value of a key-value pair in the contract.

#### Parameters

• **rpcUrl**: `string`

• **address**: `string`

Address from which to get the key value.

• **key**: `string`

Key to obtain the value.

#### Returns

`Promise`\<`string`\>

Value of the key.

#### Throws

- Thrown if the network's chainId is not supported

#### Throws

- Thrown if the Address sent is invalid

**Code example**

```ts
import { KVStore__factory, KVStoreUtils } from '@human-protocol/sdk';
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const address = '0x1234567890123456789012345678901234567890';
const key = 'Role';

const value = await KVStoreUtils.get(rpcUrl, address, key);
console.log(value);
```

#### Defined in

[kvstore.ts:385](https://github.com/humanprotocol/human-protocol/blob/c1babb1b9f88b4b81c6e0bd12c34f22f4c3c91dd/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L385)

***

### getFileUrlAndVerifyHash()

> `static` **getFileUrlAndVerifyHash**(`rpcUrl`, `address`, `urlKey`): `Promise`\<`string`\>

Gets the URL value of the given entity, and verify its hash.

#### Parameters

• **rpcUrl**: `string`

• **address**: `string`

Address from which to get the URL value.

• **urlKey**: `string` = `'url'`

Configurable URL key. `url` by default.

#### Returns

`Promise`\<`string`\>

URL value for the given address if exists, and the content is valid

**Code example**

```ts
import { KVStore__factory, KVStoreUtils } from '@human-protocol/sdk';
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const address = '0x1234567890123456789012345678901234567890';

const url = await KVStoreUtils.getFileUrlAndVerifyHash(rpcUrl, kvstoreContract, address);
console.log(url);
```

#### Defined in

[kvstore.ts:435](https://github.com/humanprotocol/human-protocol/blob/c1babb1b9f88b4b81c6e0bd12c34f22f4c3c91dd/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L435)

***

### getKVStoreData()

> `static` **getKVStoreData**(`chainId`, `address`): `Promise`\<`IKVStore`[]\>

This function returns the KVStore data for a given address.

#### Parameters

• **chainId**: `ChainId`

Network in which the KVStore is deployed

• **address**: `string`

Address of the KVStore

#### Returns

`Promise`\<`IKVStore`[]\>

KVStore data

#### Throws

- Thrown if the network's chainId is not supported

#### Throws

- Thrown if the Address sent is invalid

**Code example**

```ts
import { ChainId, KVStoreUtils } from '@human-protocol/sdk';

const kvStoreData = await KVStoreUtils.getKVStoreData(ChainId.POLYGON_AMOY, "0x1234567890123456789012345678901234567890");
console.log(kvStoreData);
```

#### Defined in

[kvstore.ts:333](https://github.com/humanprotocol/human-protocol/blob/c1babb1b9f88b4b81c6e0bd12c34f22f4c3c91dd/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L333)

***

### getPublicKey()

> `static` **getPublicKey**(`rpcUrl`, `address`): `Promise`\<`string`\>

Gets the public key of the given entity, and verify its hash.

#### Parameters

• **rpcUrl**: `string`

• **address**: `string`

Address from which to get the public key.

#### Returns

`Promise`\<`string`\>

Public key for the given address if exists, and the content is valid

**Code example**

```ts
import { KVStore__factory, KVStoreUtils } from '@human-protocol/sdk';
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const address = '0x1234567890123456789012345678901234567890';

const publicKey = await KVStoreUtils.getPublicKey(rpcUrl, address);
console.log(publicKey);
```

#### Defined in

[kvstore.ts:493](https://github.com/humanprotocol/human-protocol/blob/c1babb1b9f88b4b81c6e0bd12c34f22f4c3c91dd/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L493)
