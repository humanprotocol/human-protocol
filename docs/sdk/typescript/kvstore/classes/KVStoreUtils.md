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

const KVStoreAddresses = new KVStoreUtils.getData({
  network: ChainId.POLYGON_AMOY
});
```

## Constructors

### new KVStoreUtils()

> **new KVStoreUtils**(): [`KVStoreUtils`](KVStoreUtils.md)

#### Returns

[`KVStoreUtils`](KVStoreUtils.md)

## Methods

### getKVStoreData()

> `static` **getKVStoreData**(`chainId`, `address`): `Promise`\<`IKVStore`[]\>

This function returns the KVStore data for a given address.

> This uses Subgraph

**Input parameters**

```ts
enum ChainId {
  ALL = -1,
  MAINNET = 1,
  RINKEBY = 4,
  GOERLI = 5,
  BSC_MAINNET = 56,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  POLYGON_AMOY = 80002,
  MOONBEAM = 1284,
  MOONBASE_ALPHA = 1287,
  AVALANCHE = 43114,
  AVALANCHE_TESTNET = 43113,
  CELO = 42220,
  CELO_ALFAJORES = 44787,
  LOCALHOST = 1338,
}
```

```ts
interface IKVStore {
  key: string;
  value: string;
}
```

#### Parameters

• **chainId**: `ChainId`

Network in which the KVStore is deployed

• **address**: `string`

Address of the KVStore

#### Returns

`Promise`\<`IKVStore`[]\>

KVStore data

**Code example**

```ts
import { ChainId, KVStoreUtils } from '@human-protocol/sdk';

const kvStoreData = await KVStoreUtils.getKVStoreData(ChainId.POLYGON_AMOY, "0x1234567890123456789012345678901234567890");
console.log(kvStoreData);
```

#### Source

[kvstore.ts:498](https://github.com/humanprotocol/human-protocol/blob/8d975cea1abbae7bc4c000b3bf81cca8faa7415f/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L498)
