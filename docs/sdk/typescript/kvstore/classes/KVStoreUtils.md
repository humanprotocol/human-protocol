[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [kvstore](../README.md) / KVStoreUtils

# Class: KVStoreUtils

<<<<<<< HEAD
Defined in: [kvstore.ts:318](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L318)
=======
Defined in: [kvstore.ts:354](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L354)
>>>>>>> develop

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

> `static` **get**(`chainId`, `address`, `key`): `Promise`\<`string`\>

<<<<<<< HEAD
Defined in: [kvstore.ts:389](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L389)
=======
Defined in: [kvstore.ts:425](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L425)
>>>>>>> develop

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

> `static` **getFileUrlAndVerifyHash**(`chainId`, `address`, `urlKey`): `Promise`\<`string`\>

<<<<<<< HEAD
Defined in: [kvstore.ts:436](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L436)
=======
Defined in: [kvstore.ts:472](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L472)
>>>>>>> develop

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

> `static` **getKVStoreData**(`chainId`, `address`): `Promise`\<[`IKVStore`](../../interfaces/interfaces/IKVStore.md)[]\>

<<<<<<< HEAD
Defined in: [kvstore.ts:337](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L337)
=======
Defined in: [kvstore.ts:373](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L373)
>>>>>>> develop

This function returns the KVStore data for a given address.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the KVStore is deployed

##### address

`string`

Address of the KVStore

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

> `static` **getPublicKey**(`chainId`, `address`): `Promise`\<`string`\>

<<<<<<< HEAD
Defined in: [kvstore.ts:496](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L496)
=======
Defined in: [kvstore.ts:532](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L532)
>>>>>>> develop

Gets the public key of the given entity, and verifies its hash.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the KVStore is deployed

##### address

`string`

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
