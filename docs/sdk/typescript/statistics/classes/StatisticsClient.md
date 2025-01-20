[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [statistics](../README.md) / StatisticsClient

# Class: StatisticsClient

## Introduction

This client enables obtaining statistical information from the subgraph.

Unlike other SDK clients, `StatisticsClient` does not require `signer` or `provider` to be provided.
We just need to create a client object using relevant network data.

```ts
constructor(network: NetworkData)
```

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

##### networkData

[`NetworkData`](../../types/type-aliases/NetworkData.md)

The network information required to connect to the Statistics contract

#### Returns

[`StatisticsClient`](StatisticsClient.md)

#### Defined in

[statistics.ts:67](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L67)

## Properties

### networkData

> **networkData**: [`NetworkData`](../../types/type-aliases/NetworkData.md)

#### Defined in

[statistics.ts:59](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L59)

***

### subgraphUrl

> **subgraphUrl**: `string`

#### Defined in

[statistics.ts:60](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L60)

## Methods

### getEscrowStatistics()

> **getEscrowStatistics**(`filter`): `Promise`\<[`EscrowStatistics`](../../graphql/types/type-aliases/EscrowStatistics.md)\>

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

##### filter

[`IStatisticsFilter`](../../interfaces/interfaces/IStatisticsFilter.md) = `{}`

Statistics params with duration data

#### Returns

`Promise`\<[`EscrowStatistics`](../../graphql/types/type-aliases/EscrowStatistics.md)\>

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

[statistics.ts:120](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L120)

***

### getHMTDailyData()

> **getHMTDailyData**(`filter`): `Promise`\<[`DailyHMTData`](../../graphql/types/type-aliases/DailyHMTData.md)[]\>

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

##### filter

[`IStatisticsFilter`](../../interfaces/interfaces/IStatisticsFilter.md) = `{}`

Statistics params with duration data

#### Returns

`Promise`\<[`DailyHMTData`](../../graphql/types/type-aliases/DailyHMTData.md)[]\>

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

[statistics.ts:478](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L478)

***

### getHMTHolders()

> **getHMTHolders**(`params`): `Promise`\<[`HMTHolder`](../../graphql/types/type-aliases/HMTHolder.md)[]\>

This function returns the holders of the HMToken with optional filters and ordering.

**Input parameters**

#### Parameters

##### params

[`IHMTHoldersParams`](../../interfaces/interfaces/IHMTHoldersParams.md) = `{}`

HMT Holders params with filters and ordering

#### Returns

`Promise`\<[`HMTHolder`](../../graphql/types/type-aliases/HMTHolder.md)[]\>

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

[statistics.ts:407](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L407)

***

### getHMTStatistics()

> **getHMTStatistics**(): `Promise`\<[`HMTStatistics`](../../graphql/types/type-aliases/HMTStatistics.md)\>

This function returns the statistical data of HMToken.

```ts
type HMTStatistics = {
  totalTransferAmount: BigNumber;
  totalTransferCount: BigNumber;
  totalHolders: number;
};
```

#### Returns

`Promise`\<[`HMTStatistics`](../../graphql/types/type-aliases/HMTStatistics.md)\>

HMToken statistics data.

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

#### Defined in

[statistics.ts:364](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L364)

***

### getPaymentStatistics()

> **getPaymentStatistics**(`filter`): `Promise`\<[`PaymentStatistics`](../../graphql/types/type-aliases/PaymentStatistics.md)\>

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

##### filter

[`IStatisticsFilter`](../../interfaces/interfaces/IStatisticsFilter.md) = `{}`

Statistics params with duration data

#### Returns

`Promise`\<[`PaymentStatistics`](../../graphql/types/type-aliases/PaymentStatistics.md)\>

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

[statistics.ts:300](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L300)

***

### getWorkerStatistics()

> **getWorkerStatistics**(`filter`): `Promise`\<[`WorkerStatistics`](../../graphql/types/type-aliases/WorkerStatistics.md)\>

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

##### filter

[`IStatisticsFilter`](../../interfaces/interfaces/IStatisticsFilter.md) = `{}`

Statistics params with duration data

#### Returns

`Promise`\<[`WorkerStatistics`](../../graphql/types/type-aliases/WorkerStatistics.md)\>

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

[statistics.ts:204](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L204)
