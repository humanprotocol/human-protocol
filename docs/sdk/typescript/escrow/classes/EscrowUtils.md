[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [escrow](../README.md) / EscrowUtils

# Class: EscrowUtils

Defined in: [escrow.ts:1574](https://github.com/humanprotocol/human-protocol/blob/99b899a11bf48f2fa04884687ea395e0d42d75d1/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1574)

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
  chainId: ChainId.POLYGON_AMOY
});
```

## Constructors

### Constructor

> **new EscrowUtils**(): `EscrowUtils`

#### Returns

`EscrowUtils`

## Methods

### getEscrow()

> `static` **getEscrow**(`chainId`, `escrowAddress`): `Promise`\<[`EscrowData`](../../graphql/types/type-aliases/EscrowData.md)\>

Defined in: [escrow.ts:1789](https://github.com/humanprotocol/human-protocol/blob/99b899a11bf48f2fa04884687ea395e0d42d75d1/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1789)

This function returns the escrow data for a given address.

> This uses Subgraph

**Input parameters**

```ts
enum ChainId {
  ALL = -1,
  MAINNET = 1,
  SEPOLIA = 11155111,
  BSC_MAINNET = 56,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_AMOY = 80002,
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
  reputationOracle?: string;
  exchangeOracle?: string;
  status: EscrowStatus;
  token: string;
  totalFundedAmount: string;
  createdAt: string;
};
```

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the escrow has been deployed

##### escrowAddress

`string`

Address of the escrow

#### Returns

`Promise`\<[`EscrowData`](../../graphql/types/type-aliases/EscrowData.md)\>

Escrow data

**Code example**

```ts
import { ChainId, EscrowUtils } from '@human-protocol/sdk';

const escrowData = new EscrowUtils.getEscrow(ChainId.POLYGON_AMOY, "0x1234567890123456789012345678901234567890");
```

***

### getEscrows()

> `static` **getEscrows**(`filter`): `Promise`\<[`EscrowData`](../../graphql/types/type-aliases/EscrowData.md)[]\>

Defined in: [escrow.ts:1671](https://github.com/humanprotocol/human-protocol/blob/99b899a11bf48f2fa04884687ea395e0d42d75d1/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1671)

This function returns an array of escrows based on the specified filter parameters.

**Input parameters**

```ts
interface IEscrowsFilter {
  chainId: ChainId;
  launcher?: string;
  reputationOracle?: string;
  recordingOracle?: string;
  exchangeOracle?: string;
  jobRequesterId?: string;
  status?: EscrowStatus;
  from?: Date;
  to?: Date;
  first?: number;
  skip?: number;
  orderDirection?: OrderDirection;
}
```

```ts
enum ChainId {
  ALL = -1,
  MAINNET = 1,
  SEPOLIA = 11155111,
  BSC_MAINNET = 56,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_AMOY=80002,
  LOCALHOST = 1338,
}
```

```ts
enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
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
  reputationOracle?: string;
  exchangeOracle?: string;
  status: EscrowStatus;
  token: string;
  totalFundedAmount: string;
  createdAt: string;
};
```

#### Parameters

##### filter

[`IEscrowsFilter`](../../interfaces/interfaces/IEscrowsFilter.md)

Filter parameters.

#### Returns

`Promise`\<[`EscrowData`](../../graphql/types/type-aliases/EscrowData.md)[]\>

List of escrows that match the filter.

**Code example**

```ts
import { ChainId, EscrowUtils, EscrowStatus } from '@human-protocol/sdk';

const filters: IEscrowsFilter = {
  status: EscrowStatus.Pending,
  from: new Date(2023, 4, 8),
  to: new Date(2023, 5, 8),
  chainId: ChainId.POLYGON_AMOY
};
const escrowDatas = await EscrowUtils.getEscrows(filters);
```

***

### getPayouts()

> `static` **getPayouts**(`filter`): `Promise`\<[`Payout`](../../types/type-aliases/Payout.md)[]\>

Defined in: [escrow.ts:1959](https://github.com/humanprotocol/human-protocol/blob/99b899a11bf48f2fa04884687ea395e0d42d75d1/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1959)

This function returns the payouts for a given set of networks.

> This uses Subgraph

**Input parameters**
Fetch payouts from the subgraph.

#### Parameters

##### filter

[`IPayoutFilter`](../../interfaces/interfaces/IPayoutFilter.md)

Filter parameters.

#### Returns

`Promise`\<[`Payout`](../../types/type-aliases/Payout.md)[]\>

List of payouts matching the filters.

**Code example**

```ts
import { ChainId, EscrowUtils } from '@human-protocol/sdk';

const payouts = await EscrowUtils.getPayouts({
  chainId: ChainId.POLYGON,
  escrowAddress: '0x1234567890123456789012345678901234567890',
  recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
  from: new Date('2023-01-01'),
  to: new Date('2023-12-31')
});
console.log(payouts);
```

***

### getStatusEvents()

> `static` **getStatusEvents**(`filter`): `Promise`\<[`StatusEvent`](../../graphql/types/type-aliases/StatusEvent.md)[]\>

Defined in: [escrow.ts:1868](https://github.com/humanprotocol/human-protocol/blob/99b899a11bf48f2fa04884687ea395e0d42d75d1/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1868)

This function returns the status events for a given set of networks within an optional date range.

> This uses Subgraph

**Input parameters**

```ts
enum ChainId {
  ALL = -1,
  MAINNET = 1,
  SEPOLIA = 11155111,
  BSC_MAINNET = 56,
  BSC_TESTNET = 97,
  POLYGON = 137,
  POLYGON_AMOY = 80002,
  LOCALHOST = 1338,
}
```

```ts
enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}
```

```ts
type Status = {
  escrowAddress: string;
  timestamp: string;
  status: string;
};
```

#### Parameters

##### filter

[`IStatusEventFilter`](../../interfaces/interfaces/IStatusEventFilter.md)

Filter parameters.

#### Returns

`Promise`\<[`StatusEvent`](../../graphql/types/type-aliases/StatusEvent.md)[]\>

- Array of status events with their corresponding statuses.

**Code example**

```ts
import { ChainId, EscrowUtils, EscrowStatus } from '@human-protocol/sdk';

(async () => {
  const fromDate = new Date('2023-01-01');
  const toDate = new Date('2023-12-31');
  const statusEvents = await EscrowUtils.getStatusEvents({
    chainId: ChainId.POLYGON,
    statuses: [EscrowStatus.Pending, EscrowStatus.Complete],
    from: fromDate,
    to: toDate
  });
  console.log(statusEvents);
})();
```
