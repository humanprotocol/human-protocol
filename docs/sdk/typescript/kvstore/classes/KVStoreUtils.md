[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [kvstore](../README.md) / KVStoreUtils

# Class: KVStoreUtils

Defined in: [kvstore.ts:354](https://github.com/humanprotocol/human-protocol/blob/0661934b14ae802af3f939783433c196862268e2/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L354)

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

const KVStoreAddresses = await KVStoreUtils.getKVStoreData(
  ChainId.POLYGON_AMOY,
  "0x1234567890123456789012345678901234567890"
);
```

## Constructors

### Constructor

> **new KVStoreUtils**(): `KVStoreUtils`

#### Returns

`KVStoreUtils`

## Methods

### get()

> `static` **get**(`chainId`, `address`, `key`, `options?`): `Promise`\<`string`\>

Defined in: [kvstore.ts:429](https://github.com/humanprotocol/human-protocol/blob/0661934b14ae802af3f939783433c196862268e2/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L429)

Gets the value of a key-value pair in the KVStore using the subgraph.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the KVStore is deployed

##### address

`string`

Address from which to get the key value.

##### key

`string`

Key to obtain the value.

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

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

***

### getFileUrlAndVerifyHash()

> `static` **getFileUrlAndVerifyHash**(`chainId`, `address`, `urlKey`, `options?`): `Promise`\<`string`\>

Defined in: [kvstore.ts:479](https://github.com/humanprotocol/human-protocol/blob/0661934b14ae802af3f939783433c196862268e2/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L479)

Gets the URL value of the given entity, and verifies its hash.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the KVStore is deployed

##### address

`string`

Address from which to get the URL value.

##### urlKey

`string` = `'url'`

Configurable URL key. `url` by default.

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

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

***

### getKVStoreData()

> `static` **getKVStoreData**(`chainId`, `address`, `options?`): `Promise`\<[`IKVStore`](../../interfaces/interfaces/IKVStore.md)[]\>

Defined in: [kvstore.ts:374](https://github.com/humanprotocol/human-protocol/blob/0661934b14ae802af3f939783433c196862268e2/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L374)

This function returns the KVStore data for a given address.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the KVStore is deployed

##### address

`string`

Address of the KVStore

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IKVStore`](../../interfaces/interfaces/IKVStore.md)[]\>

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

***

### getPublicKey()

> `static` **getPublicKey**(`chainId`, `address`, `options?`): `Promise`\<`string`\>

Defined in: [kvstore.ts:540](https://github.com/humanprotocol/human-protocol/blob/0661934b14ae802af3f939783433c196862268e2/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L540)

Gets the public key of the given entity, and verifies its hash.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the KVStore is deployed

##### address

`string`

Address from which to get the public key.

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

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
