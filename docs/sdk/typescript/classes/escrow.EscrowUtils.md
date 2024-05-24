[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [escrow](../modules/escrow.md) / EscrowUtils

# Class: EscrowUtils

[escrow](../modules/escrow.md).EscrowUtils

## Introduction

Utility class for escrow-related operations.

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
import { ChainId, EscrowUtils } from '@human-protocol/sdk';

const escrowAddresses = new EscrowUtils.getEscrows({
  networks: [ChainId.POLYGON_AMOY]
});
```

## Table of contents

### Constructors

- [constructor](escrow.EscrowUtils.md#constructor)

### Methods

- [getEscrow](escrow.EscrowUtils.md#getescrow)
- [getEscrows](escrow.EscrowUtils.md#getescrows)

## Constructors

### constructor

• **new EscrowUtils**(): [`EscrowUtils`](escrow.EscrowUtils.md)

#### Returns

[`EscrowUtils`](escrow.EscrowUtils.md)

## Methods

### getEscrow

▸ **getEscrow**(`chainId`, `escrowAddress`): `Promise`\<`EscrowData`\>

This function returns the escrow data for a given address.

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
  SKALE = 1273227453,
  LOCALHOST = 1338,
}
```

```ts
type EscrowData = {
  id: string;
  address: string;
  amountPaid: string;
  balance: string;
  count: string;
  jobRequesterId: string;
  factoryAddress: string;
  finalResultsUrl?: string;
  intermediateResultsUrl?: string;
  launcher: string;
  manifestHash?: string;
  manifestUrl?: string;
  recordingOracle?: string;
  recordingOracleFee?: string;
  reputationOracle?: string;
  reputationOracleFee?: string;
  exchangeOracle?: string;
  exchangeOracleFee?: string;
  status: EscrowStatus;
  token: string;
  totalFundedAmount: string;
  createdAt: string;
};
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `ChainId` | Network in which the escrow has been deployed |
| `escrowAddress` | `string` | Address of the escrow |

#### Returns

`Promise`\<`EscrowData`\>

Escrow data

**Code example**

```ts
import { ChainId, EscrowUtils } from '@human-protocol/sdk';

const escrowData = new EscrowUtils.getEscrow(ChainId.POLYGON_AMOY, "0x1234567890123456789012345678901234567890");
```

#### Defined in

[escrow.ts:1634](https://github.com/humanprotocol/human-protocol/blob/c5bdba8d09572dcd1b7eef0032edf59f6f0b1b0f/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1634)

___

### getEscrows

▸ **getEscrows**(`filter`): `Promise`\<`EscrowData`[]\>

This function returns an array of escrows based on the specified filter parameters.

**Input parameters**

```ts
interface IEscrowsFilter {
  networks: ChainId[];
  launcher?: string;
  reputationOracle?: string;
  recordingOracle?: string;
  exchangeOracle?: string;
  jobRequesterId?: string;
  status?: EscrowStatus;
  from?: Date;
  to?: Date;
}
```

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
  POLYGON_AMOY=80002,
  MOONBEAM = 1284,
  MOONBASE_ALPHA = 1287,
  AVALANCHE = 43114,
  AVALANCHE_TESTNET = 43113,
  CELO = 42220,
  CELO_ALFAJORES = 44787,
  SKALE = 1273227453,
  LOCALHOST = 1338,
}
```

```ts
enum EscrowStatus {
  Launched,
  Pending,
  Partial,
  Paid,
  Complete,
  Cancelled,
}
```

```ts
type EscrowData = {
  id: string;
  address: string;
  amountPaid: string;
  balance: string;
  count: string;
  jobRequesterId: string;
  factoryAddress: string;
  finalResultsUrl?: string;
  intermediateResultsUrl?: string;
  launcher: string;
  manifestHash?: string;
  manifestUrl?: string;
  recordingOracle?: string;
  recordingOracleFee?: string;
  reputationOracle?: string;
  reputationOracleFee?: string;
  exchangeOracle?: string;
  exchangeOracleFee?: string;
  status: EscrowStatus;
  token: string;
  totalFundedAmount: string;
  createdAt: string;
};
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `filter` | `IEscrowsFilter` | Filter parameters. |

#### Returns

`Promise`\<`EscrowData`[]\>

List of escrows that match the filter.

**Code example**

```ts
import { ChainId, EscrowUtils, EscrowStatus } from '@human-protocol/sdk';

const filters: IEscrowsFilter = {
  status: EscrowStatus.Pending,
  from: new Date(2023, 4, 8),
  to: new Date(2023, 5, 8),
  networks: [ChainId.POLYGON_AMOY]
};
const escrowDatas = await EscrowUtils.getEscrows(filters);
```

#### Defined in

[escrow.ts:1505](https://github.com/humanprotocol/human-protocol/blob/c5bdba8d09572dcd1b7eef0032edf59f6f0b1b0f/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1505)
