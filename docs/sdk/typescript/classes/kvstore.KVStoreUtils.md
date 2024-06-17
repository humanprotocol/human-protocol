[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [kvstore](../modules/kvstore.md) / KVStoreUtils

# Class: KVStoreUtils

[kvstore](../modules/kvstore.md).KVStoreUtils

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
  networks: [ChainId.POLYGON_AMOY]
});
```

## Table of contents

### Constructors

- [constructor](kvstore.KVStoreUtils.md#constructor)

### Methods

- [getKVStoreData](kvstore.KVStoreUtils.md#getkvstoredata)

## Constructors

### constructor

• **new KVStoreUtils**(): [`KVStoreUtils`](kvstore.KVStoreUtils.md)

#### Returns

[`KVStoreUtils`](kvstore.KVStoreUtils.md)

## Methods

### getKVStoreData

▸ **getKVStoreData**(`chainId`, `address`): `Promise`\<`IKVStore`[]\>

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

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `ChainId` | Network in which the KVStore is deployed |
| `address` | `string` | Address of the KVStore |

#### Returns

`Promise`\<`IKVStore`[]\>

KVStore data

**Code example**

```ts
import { ChainId, KVStoreUtils } from '@human-protocol/sdk';

const kvStoreData = await KVStoreUtils.getKVStoreData(ChainId.POLYGON_AMOY, "0x1234567890123456789012345678901234567890");
console.log(kvStoreData);
```

#### Defined in

[kvstore.ts:498](https://github.com/humanprotocol/human-protocol/blob/228cb42bcd420546605e48ae309510bc59209d10/packages/sdk/typescript/human-protocol-sdk/src/kvstore.ts#L498)
