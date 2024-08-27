[**@human-protocol/sdk**](../../README.md) • **Docs**

***

[@human-protocol/sdk](../../modules.md) / [statistics](../README.md) / StatisticsClient

# Class: StatisticsClient

## Introduction

This client enables to obtain statistical information from the subgraph.

Unlikely from the other SDK clients, `StatisticsClient` does not require `signer` or `provider` to be provided.
We just need to create client object using relevant network data.

```ts
constructor(network: NetworkData)
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

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);
```

## Constructors

### new StatisticsClient()

> **new StatisticsClient**(`networkData`): [`StatisticsClient`](StatisticsClient.md)

**StatisticsClient constructor**

#### Parameters

• **networkData**: `NetworkData`

The network information required to connect to the Statistics contract

#### Returns

[`StatisticsClient`](StatisticsClient.md)

#### Defined in

[statistics.ts:72](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L72)

## Properties

### networkData

> **networkData**: `NetworkData`

#### Defined in

[statistics.ts:64](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L64)

***

### subgraphUrl

> **subgraphUrl**: `string`

#### Defined in

[statistics.ts:65](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L65)

## Methods

### getEscrowStatistics()

> **getEscrowStatistics**(`filter`): `Promise`\<`EscrowStatistics`\>

This function returns the statistical data of escrows.

**Input parameters**

```ts
interface IStatisticsFilter {
  from?: Date;
  to?: Date;
  first?: number; // (Optional) Number of transactions per page. Default is 10.
  skip?: number; // (Optional) Number of transactions to skip. Default is 0.
  orderDirection?: OrderDirection; // (Optional) Order of the results. Default is ASC.
}
```

```ts
type DailyEscrowsData = {
  timestamp: Date;
  escrowsTotal: number;
  escrowsPending: number;
  escrowsSolved: number;
  escrowsPaid: number;
  escrowsCancelled: number;
};

type EscrowStatistics = {
  totalEscrows: number;
  dailyEscrowsData: DailyEscrowsData[];
};
```

#### Parameters

• **filter**: `IStatisticsFilter` = `{}`

Statistics params with duration data

#### Returns

`Promise`\<`EscrowStatistics`\>

Escrow statistics data.

**Code example**

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);

const escrowStatistics = await statisticsClient.getEscrowStatistics();
const escrowStatisticsApril = await statisticsClient.getEscrowStatistics({
   from: new Date('2021-04-01'),
   to: new Date('2021-04-30'),
});
```

#### Defined in

[statistics.ts:128](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L128)

***

### getHMTDailyData()

> **getHMTDailyData**(`filter`): `Promise`\<`DailyHMTData`[]\>

This function returns the statistical data of HMToken day by day.

**Input parameters**

```ts
interface IStatisticsFilter {
  from?: Date;
  to?: Date;
  first?: number; // (Optional) Number of transactions per page. Default is 10.
  skip?: number; // (Optional) Number of transactions to skip. Default is 0.
  orderDirection?: OrderDirection; // (Optional) Order of the results. Default is ASC.
}
```

```ts
type DailyHMTData = {
  timestamp: Date;
  totalTransactionAmount: bigint;
  totalTransactionCount: number;
  dailyUniqueSenders: number;
  dailyUniqueReceivers: number;
}
```

#### Parameters

• **filter**: `IStatisticsFilter` = `{}`

Statistics params with duration data

#### Returns

`Promise`\<`DailyHMTData`[]\>

Daily HMToken statistics data.

**Code example**

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);

const dailyHMTStats = await statisticsClient.getHMTStatistics();

console.log('Daily HMT statistics:', dailyHMTStats);

const hmtStatisticsRange = await statisticsClient.getHMTStatistics({
  from: new Date(2023, 4, 8),
  to: new Date(2023, 5, 8),
});

console.log('HMT statistics from 5/8 - 6/8:', hmtStatisticsRange);
```

#### Defined in

[statistics.ts:495](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L495)

***

### getHMTHolders()

> **getHMTHolders**(`params`): `Promise`\<`HMTHolder`[]\>

This function returns the holders of the HMToken with optional filters and ordering.

**Input parameters**

#### Parameters

• **params**: `IHMTHoldersParams` = `{}`

HMT Holders params with filters and ordering

#### Returns

`Promise`\<`HMTHolder`[]\>

List of HMToken holders.

**Code example**

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);

const hmtHolders = await statisticsClient.getHMTHolders({
  orderDirection: 'asc',
});

console.log('HMT holders:', hmtHolders.map((h) => ({
  ...h,
  balance: h.balance.toString(),
})));
```

#### Defined in

[statistics.ts:421](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L421)

***

### getHMTStatistics()

> **getHMTStatistics**(): `Promise`\<`HMTStatistics`\>

This function returns the statistical data of HMToken.

type HMTStatistics = {
  totalTransferAmount: BigNumber;
  totalTransferCount: BigNumber;
  totalHolders: number;
};
```

@returns {HMTStatistics} HMToken statistics data.

**Code example**

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);

const hmtStatistics = await statisticsClient.getHMTStatistics();

console.log('HMT statistics:', {
  ...hmtStatistics,
  totalTransferAmount: hmtStatistics.totalTransferAmount.toString(),
});
```

#### Returns

`Promise`\<`HMTStatistics`\>

#### Defined in

[statistics.ts:378](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L378)

***

### getPaymentStatistics()

> **getPaymentStatistics**(`filter`): `Promise`\<`PaymentStatistics`\>

This function returns the statistical data of payments.

**Input parameters**

```ts
interface IStatisticsFilter {
  from?: Date;
  to?: Date;
  first?: number; // (Optional) Number of transactions per page. Default is 10.
  skip?: number; // (Optional) Number of transactions to skip. Default is 0.
  orderDirection?: OrderDirection; // (Optional) Order of the results. Default is ASC.
}
```

```ts
type DailyPaymentData = {
  timestamp: Date;
  totalAmountPaid: BigNumber;
  totalCount: number;
  averageAmountPerWorker: BigNumber;
};

type PaymentStatistics = {
  dailyPaymentsData: DailyPaymentData[];
};
```

#### Parameters

• **filter**: `IStatisticsFilter` = `{}`

Statistics params with duration data

#### Returns

`Promise`\<`PaymentStatistics`\>

Payment statistics data.

**Code example**

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);

console.log(
  'Payment statistics:',
  (await statisticsClient.getPaymentStatistics()).dailyPaymentsData.map(
    (p) => ({
      ...p,
      totalAmountPaid: p.totalAmountPaid.toString(),
      averageAmountPerJob: p.averageAmountPerJob.toString(),
      averageAmountPerWorker: p.averageAmountPerWorker.toString(),
    })
  )
);

console.log(
  'Payment statistics from 5/8 - 6/8:',
  (
    await statisticsClient.getPaymentStatistics({
      from: new Date(2023, 4, 8),
      to: new Date(2023, 5, 8),
    })
  ).dailyPaymentsData.map((p) => ({
    ...p,
    totalAmountPaid: p.totalAmountPaid.toString(),
    averageAmountPerJob: p.averageAmountPerJob.toString(),
    averageAmountPerWorker: p.averageAmountPerWorker.toString(),
  }))
);
```

#### Defined in

[statistics.ts:312](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L312)

***

### getWorkerStatistics()

> **getWorkerStatistics**(`filter`): `Promise`\<`WorkerStatistics`\>

This function returns the statistical data of workers.

**Input parameters**

```ts
interface IStatisticsFilter {
  from?: Date;
  to?: Date;
  first?: number; // (Optional) Number of transactions per page. Default is 10.
  skip?: number; // (Optional) Number of transactions to skip. Default is 0.
  orderDirection?: OrderDirection; // (Optional) Order of the results. Default is ASC.
}
```

```ts
type DailyWorkerData = {
  timestamp: Date;
  activeWorkers: number;
};

type WorkerStatistics = {
  dailyWorkersData: DailyWorkerData[];
};
```

#### Parameters

• **filter**: `IStatisticsFilter` = `{}`

Statistics params with duration data

#### Returns

`Promise`\<`WorkerStatistics`\>

Worker statistics data.

**Code example**

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_AMOY]);

const workerStatistics = await statisticsClient.getWorkerStatistics();
const workerStatisticsApril = await statisticsClient.getWorkerStatistics({
   from: new Date('2021-04-01'),
   to: new Date('2021-04-30'),
});
```

#### Defined in

[statistics.ts:213](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L213)
