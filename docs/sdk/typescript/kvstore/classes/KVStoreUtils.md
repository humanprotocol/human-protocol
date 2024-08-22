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

> `static` **get**(`chainId`, `address`, `key`): `Promise`\<`string`\>

Gets the value of a key-value pair in the KVStore using the subgraph.

#### Parameters

• **chainId**: `ChainId`

Network in which the KVStore is deployed

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

#### Throws

- Thrown if the key is empty

**Code example**

```ts
import { ChainId, KVStoreUtils } from '@human-protocol/sdk';

const chainId = ChainId.POLYGON_AMOY;
const address = '0x1234567890123456789012345678901234567890';
const key = 'role';

const value = await KVStoreUtils.get(chainId, address, key);
console.log(value);
```

#### Defined in

[kvstore.ts:388](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L388)

***

### getFileUrlAndVerifyHash()

> `static` **getFileUrlAndVerifyHash**(`chainId`, `address`, `urlKey`): `Promise`\<`string`\>

Gets the URL value of the given entity, and verifies its hash.

#### Parameters

• **chainId**: `ChainId`

Network in which the KVStore is deployed

• **address**: `string`

Address from which to get the URL value.

• **urlKey**: `string` = `'url'`

Configurable URL key. `url` by default.

#### Returns

`Promise`\<`string`\>

URL value for the given address if it exists, and the content is valid

**Code example**

```ts
import { ChainId, KVStoreUtils } from '@human-protocol/sdk';

const chainId = ChainId.POLYGON_AMOY;
const address = '0x1234567890123456789012345678901234567890';

const url = await KVStoreUtils.getFileUrlAndVerifyHash(chainId, address);
console.log(url);
```

#### Defined in

[kvstore.ts:437](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L437)

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

[kvstore.ts:336](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L336)

***

### getPublicKey()

> `static` **getPublicKey**(`chainId`, `address`): `Promise`\<`string`\>

Gets the public key of the given entity, and verifies its hash.

#### Parameters

• **chainId**: `ChainId`

Network in which the KVStore is deployed

• **address**: `string`

Address from which to get the public key.

#### Returns

`Promise`\<`string`\>

Public key for the given address if it exists, and the content is valid

**Code example**

```ts
import { ChainId, KVStoreUtils } from '@human-protocol/sdk';

const chainId = ChainId.POLYGON_AMOY;
const address = '0x1234567890123456789012345678901234567890';

const publicKey = await KVStoreUtils.getPublicKey(chainId, address);
console.log(publicKey);
```

#### Defined in

[kvstore.ts:494](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L494)
