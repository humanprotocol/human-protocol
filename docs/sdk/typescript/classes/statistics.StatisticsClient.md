[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [statistics](../modules/statistics.md) / StatisticsClient

# Class: StatisticsClient

[statistics](../modules/statistics.md).StatisticsClient

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

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_MUMBAI]);
```

## Table of contents

### Constructors

- [constructor](statistics.StatisticsClient.md#constructor)

### Properties

- [networkData](statistics.StatisticsClient.md#networkdata)

### Methods

- [getEscrowStatistics](statistics.StatisticsClient.md#getescrowstatistics)
- [getHMTStatistics](statistics.StatisticsClient.md#gethmtstatistics)
- [getPaymentStatistics](statistics.StatisticsClient.md#getpaymentstatistics)
- [getWorkerStatistics](statistics.StatisticsClient.md#getworkerstatistics)

## Constructors

### constructor

• **new StatisticsClient**(`networkData`): [`StatisticsClient`](statistics.StatisticsClient.md)

**StatisticsClient constructor**

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `networkData` | `NetworkData` | The network information required to connect to the Statistics contract |

#### Returns

[`StatisticsClient`](statistics.StatisticsClient.md)

#### Defined in

[statistics.ts:68](https://github.com/humanprotocol/human-protocol/blob/48066071/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L68)

## Properties

### networkData

• **networkData**: `NetworkData`

#### Defined in

[statistics.ts:61](https://github.com/humanprotocol/human-protocol/blob/48066071/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L61)

## Methods

### getEscrowStatistics

▸ **getEscrowStatistics**(`params?`): `Promise`\<`EscrowStatistics`\>

This function returns the statistical data of escrows.

**Input parameters**

```ts
interface IStatisticsParams {
  from?: Date;
  to?: Date;
  limit?: number;
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

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `IStatisticsParams` | Statistics params with duration data |

#### Returns

`Promise`\<`EscrowStatistics`\>

Escrow statistics data.

**Code example**

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_MUMBAI]);

const escrowStatistics = await statisticsClient.getEscrowStatistics();
const escrowStatisticsApril = await statisticsClient.getEscrowStatistics({
   from: new Date('2021-04-01'),
   to: new Date('2021-04-30'),
});
```

#### Defined in

[statistics.ts:121](https://github.com/humanprotocol/human-protocol/blob/48066071/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L121)

___

### getHMTStatistics

▸ **getHMTStatistics**(`params?`): `Promise`\<`HMTStatistics`\>

This function returns the statistical data of HMToken.

**Input parameters**

```ts
interface IStatisticsParams {
  from?: Date;
  to?: Date;
  limit?: number;
}
```

```ts
type HMTHolder = {
  address: string;
  balance: BigNumber;
}

type DailyHMTData = {
  timestamp: Date;
  totalTransactionAmount: BigNumber;
  totalTransactionCount: number;
};

type HMTStatistics = {
  totalTransferAmount: BigNumber;
  totalTransferCount: BigNumber;
  totalHolders: number;
  holders: HMTHolder[];
  dailyHMTData: DailyHMTData[];
};
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `IStatisticsParams` | Statistics params with duration data |

#### Returns

`Promise`\<`HMTStatistics`\>

HMToken statistics data.

**Code example**

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_MUMBAI]);

const hmtStatistics = await statisticsClient.getHMTStatistics();

console.log('HMT statistics:', {
  ...hmtStatistics,
  totalTransferAmount: hmtStatistics.totalTransferAmount.toString(),
  holders: hmtStatistics.holders.map((h) => ({
    ...h,
    balance: h.balance.toString(),
  })),
  dailyHMTData: hmtStatistics.dailyHMTData.map((d) => ({
    ...d,
    totalTransactionAmount: d.totalTransactionAmount.toString(),
  })),
});

const hmtStatisticsRange = await statisticsClient.getHMTStatistics({
  from: new Date(2023, 4, 8),
  to: new Date(2023, 5, 8),
});

console.log('HMT statistics from 5/8 - 6/8:', {
  ...hmtStatisticsRange,
  totalTransferAmount: hmtStatisticsRange.totalTransferAmount.toString(),
  holders: hmtStatisticsRange.holders.map((h) => ({
    ...h,
    balance: h.balance.toString(),
  })),
  dailyHMTData: hmtStatisticsRange.dailyHMTData.map((d) => ({
    ...d,
    totalTransactionAmount: d.totalTransactionAmount.toString(),
  })),
});
```

#### Defined in

[statistics.ts:394](https://github.com/humanprotocol/human-protocol/blob/48066071/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L394)

___

### getPaymentStatistics

▸ **getPaymentStatistics**(`params?`): `Promise`\<`PaymentStatistics`\>

This function returns the statistical data of payments.

**Input parameters**

```ts
interface IStatisticsParams {
  from?: Date;
  to?: Date;
  limit?: number;
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

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `IStatisticsParams` | Statistics params with duration data |

#### Returns

`Promise`\<`PaymentStatistics`\>

Payment statistics data.

**Code example**

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_MUMBAI]);

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

[statistics.ts:285](https://github.com/humanprotocol/human-protocol/blob/48066071/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L285)

___

### getWorkerStatistics

▸ **getWorkerStatistics**(`params?`): `Promise`\<`WorkerStatistics`\>

This function returns the statistical data of workers.

**Input parameters**

```ts
interface IStatisticsParams {
  from?: Date;
  to?: Date;
  limit?: number;
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

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `IStatisticsParams` | Statistics params with duration data |

#### Returns

`Promise`\<`WorkerStatistics`\>

Worker statistics data.

**Code example**

```ts
import { StatisticsClient, ChainId, NETWORKS } from '@human-protocol/sdk';

const statisticsClient = new StatisticsClient(NETWORKS[ChainId.POLYGON_MUMBAI]);

const workerStatistics = await statisticsClient.getWorkerStatistics();
const workerStatisticsApril = await statisticsClient.getWorkerStatistics({
   from: new Date('2021-04-01'),
   to: new Date('2021-04-30'),
});
```

#### Defined in

[statistics.ts:196](https://github.com/humanprotocol/human-protocol/blob/48066071/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L196)
