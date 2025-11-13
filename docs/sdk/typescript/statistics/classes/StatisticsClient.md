[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [statistics](../README.md) / StatisticsClient

# Class: StatisticsClient

Defined in: [statistics.ts:64](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L64)

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

### Constructor

> **new StatisticsClient**(`networkData`): `StatisticsClient`

Defined in: [statistics.ts:73](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L73)

**StatisticsClient constructor**

#### Parameters

##### networkData

[`NetworkData`](../../types/type-aliases/NetworkData.md)

The network information required to connect to the Statistics contract

#### Returns

`StatisticsClient`

## Properties

### networkData

> **networkData**: [`NetworkData`](../../types/type-aliases/NetworkData.md)

Defined in: [statistics.ts:65](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L65)

***

### subgraphUrl

> **subgraphUrl**: `string`

Defined in: [statistics.ts:66](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L66)

## Methods

### getEscrowStatistics()

> **getEscrowStatistics**(`filter`, `options?`): `Promise`\<[`IEscrowStatistics`](../../interfaces/interfaces/IEscrowStatistics.md)\>

Defined in: [statistics.ts:127](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L127)

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
interface IDailyEscrow {
  timestamp: number;
  escrowsTotal: number;
  escrowsPending: number;
  escrowsSolved: number;
  escrowsPaid: number;
  escrowsCancelled: number;
};

interface IEscrowStatistics {
  totalEscrows: number;
  dailyEscrowsData: IDailyEscrow[];
};
```

#### Parameters

##### filter

[`IStatisticsFilter`](../../interfaces/interfaces/IStatisticsFilter.md) = `{}`

Statistics params with duration data

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IEscrowStatistics`](../../interfaces/interfaces/IEscrowStatistics.md)\>

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

***

### getHMTDailyData()

> **getHMTDailyData**(`filter`, `options?`): `Promise`\<[`IDailyHMT`](../../interfaces/interfaces/IDailyHMT.md)[]\>

Defined in: [statistics.ts:510](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L510)

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
interface IDailyHMT {
  timestamp: number;
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

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IDailyHMT`](../../interfaces/interfaces/IDailyHMT.md)[]\>

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

***

### getHMTHolders()

> **getHMTHolders**(`params`, `options?`): `Promise`\<[`IHMTHolder`](../../interfaces/interfaces/IHMTHolder.md)[]\>

Defined in: [statistics.ts:434](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L434)

This function returns the holders of the HMToken with optional filters and ordering.

**Input parameters**

#### Parameters

##### params

[`IHMTHoldersParams`](../../interfaces/interfaces/IHMTHoldersParams.md) = `{}`

HMT Holders params with filters and ordering

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IHMTHolder`](../../interfaces/interfaces/IHMTHolder.md)[]\>

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

***

### getHMTStatistics()

> **getHMTStatistics**(`options?`): `Promise`\<[`IHMTStatistics`](../../interfaces/interfaces/IHMTStatistics.md)\>

Defined in: [statistics.ts:392](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L392)

This function returns the statistical data of HMToken.

```ts
interface IHMTStatistics {
  totalTransferAmount: bigint;
  totalTransferCount: number;
  totalHolders: number;
};
```

#### Parameters

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IHMTStatistics`](../../interfaces/interfaces/IHMTStatistics.md)\>

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

***

### getPaymentStatistics()

> **getPaymentStatistics**(`filter`, `options?`): `Promise`\<[`IPaymentStatistics`](../../interfaces/interfaces/IPaymentStatistics.md)\>

Defined in: [statistics.ts:321](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L321)

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
interface IDailyPayment {
  timestamp: number;
  totalAmountPaid: bigint;
  totalCount: number;
  averageAmountPerWorker: bigint;
};

interface IPaymentStatistics {
  dailyPaymentsData: IDailyPayment[];
};
```

#### Parameters

##### filter

[`IStatisticsFilter`](../../interfaces/interfaces/IStatisticsFilter.md) = `{}`

Statistics params with duration data

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IPaymentStatistics`](../../interfaces/interfaces/IPaymentStatistics.md)\>

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

***

### getWorkerStatistics()

> **getWorkerStatistics**(`filter`, `options?`): `Promise`\<[`IWorkerStatistics`](../../interfaces/interfaces/IWorkerStatistics.md)\>

Defined in: [statistics.ts:218](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L218)

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
interface IDailyWorker {
  timestamp: number;
  activeWorkers: number;
};

interface IWorkerStatistics {
  dailyWorkersData: IDailyWorker[];
};
```

#### Parameters

##### filter

[`IStatisticsFilter`](../../interfaces/interfaces/IStatisticsFilter.md) = `{}`

Statistics params with duration data

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IWorkerStatistics`](../../interfaces/interfaces/IWorkerStatistics.md)\>

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
