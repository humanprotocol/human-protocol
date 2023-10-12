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

- [network](statistics.StatisticsClient.md#network)

### Methods

- [getEscrowStatistics](statistics.StatisticsClient.md#getescrowstatistics)
- [getHMTStatistics](statistics.StatisticsClient.md#gethmtstatistics)
- [getPaymentStatistics](statistics.StatisticsClient.md#getpaymentstatistics)
- [getWorkerStatistics](statistics.StatisticsClient.md#getworkerstatistics)

## Constructors

### constructor

• **new StatisticsClient**(`network`)

**StatisticsClient constructor**

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `network` | `NetworkData` | The network information required to connect to the Statistics contract |

#### Defined in

[statistics.ts:68](https://github.com/humanprotocol/human-protocol/blob/04b5bdf5/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L68)

## Properties

### network

• **network**: `NetworkData`

#### Defined in

[statistics.ts:61](https://github.com/humanprotocol/human-protocol/blob/04b5bdf5/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L61)

## Methods

### getEscrowStatistics

▸ **getEscrowStatistics**(`params?`): `Promise`<`EscrowStatistics`\>

This function returns the statistical data of escrows.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `IStatisticsParams` | Statistics params with duration data |

#### Returns

`Promise`<`EscrowStatistics`\>

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

[statistics.ts:93](https://github.com/humanprotocol/human-protocol/blob/04b5bdf5/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L93)

___

### getHMTStatistics

▸ **getHMTStatistics**(`params?`): `Promise`<`HMTStatistics`\>

This function returns the statistical data of HMToken.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `IStatisticsParams` | Statistics params with duration data |

#### Returns

`Promise`<`HMTStatistics`\>

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

[statistics.ts:297](https://github.com/humanprotocol/human-protocol/blob/04b5bdf5/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L297)

___

### getPaymentStatistics

▸ **getPaymentStatistics**(`params?`): `Promise`<`PaymentStatistics`\>

This function returns the statistical data of payments.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `IStatisticsParams` | Statistics params with duration data |

#### Returns

`Promise`<`PaymentStatistics`\>

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

[statistics.ts:214](https://github.com/humanprotocol/human-protocol/blob/04b5bdf5/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L214)

___

### getWorkerStatistics

▸ **getWorkerStatistics**(`params?`): `Promise`<`WorkerStatistics`\>

This function returns the statistical data of workers.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `IStatisticsParams` | Statistics params with duration data |

#### Returns

`Promise`<`WorkerStatistics`\>

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

[statistics.ts:145](https://github.com/humanprotocol/human-protocol/blob/04b5bdf5/packages/sdk/typescript/human-protocol-sdk/src/statistics.ts#L145)
