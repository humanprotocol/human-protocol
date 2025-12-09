Utility class for statistics-related queries.

Unlike other SDK clients, `StatisticsUtils` does not require `signer` or `provider` to be provided.
We just need to pass the network data to each static method.

## Example

```ts
import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';

const networkData = NETWORKS[ChainId.POLYGON_AMOY];
const escrowStats = await StatisticsUtils.getEscrowStatistics(networkData);
console.log('Total escrows:', escrowStats.totalEscrows);
```

## Methods

### getEscrowStatistics()

```ts
static getEscrowStatistics(
   networkData: NetworkData, 
   filter: IStatisticsFilter, 
options?: SubgraphOptions): Promise<IEscrowStatistics>;
```

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

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `networkData` | [`NetworkData`](../type-aliases/NetworkData.md) | The network information required to connect to the subgraph |
| `filter` | `IStatisticsFilter` | Statistics params with duration data |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IEscrowStatistics` | Escrow statistics data. |

???+ example "Example"

    ```ts
    import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
    
    const networkData = NETWORKS[ChainId.POLYGON_AMOY];
    const escrowStats = await StatisticsUtils.getEscrowStatistics(networkData);
    console.log('Total escrows:', escrowStats.totalEscrows);
    
    const escrowStatsApril = await StatisticsUtils.getEscrowStatistics(
      networkData,
      {
        from: new Date('2021-04-01'),
        to: new Date('2021-04-30'),
      }
    );
    console.log('April escrows:', escrowStatsApril.totalEscrows);
    ```


***

### getWorkerStatistics()

```ts
static getWorkerStatistics(
   networkData: NetworkData, 
   filter: IStatisticsFilter, 
options?: SubgraphOptions): Promise<IWorkerStatistics>;
```

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

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `networkData` | [`NetworkData`](../type-aliases/NetworkData.md) | The network information required to connect to the subgraph |
| `filter` | `IStatisticsFilter` | Statistics params with duration data |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IWorkerStatistics` | Worker statistics data. |

???+ example "Example"

    ```ts
    import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
    
    const networkData = NETWORKS[ChainId.POLYGON_AMOY];
    const workerStats = await StatisticsUtils.getWorkerStatistics(networkData);
    console.log('Daily workers data:', workerStats.dailyWorkersData);
    
    const workerStatsApril = await StatisticsUtils.getWorkerStatistics(
      networkData,
      {
        from: new Date('2021-04-01'),
        to: new Date('2021-04-30'),
      }
    );
    console.log('April workers:', workerStatsApril.dailyWorkersData.length);
    ```


***

### getPaymentStatistics()

```ts
static getPaymentStatistics(
   networkData: NetworkData, 
   filter: IStatisticsFilter, 
options?: SubgraphOptions): Promise<IPaymentStatistics>;
```

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

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `networkData` | [`NetworkData`](../type-aliases/NetworkData.md) | The network information required to connect to the subgraph |
| `filter` | `IStatisticsFilter` | Statistics params with duration data |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IPaymentStatistics` | Payment statistics data. |

???+ example "Example"

    ```ts
    import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
    
    const networkData = NETWORKS[ChainId.POLYGON_AMOY];
    const paymentStats = await StatisticsUtils.getPaymentStatistics(networkData);
    console.log(
      'Payment statistics:',
      paymentStats.dailyPaymentsData.map((p) => ({
        ...p,
        totalAmountPaid: p.totalAmountPaid.toString(),
        averageAmountPerWorker: p.averageAmountPerWorker.toString(),
      }))
    );
    
    const paymentStatsRange = await StatisticsUtils.getPaymentStatistics(
      networkData,
      {
        from: new Date(2023, 4, 8),
        to: new Date(2023, 5, 8),
      }
    );
    console.log('Payment statistics from 5/8 - 6/8:', paymentStatsRange.dailyPaymentsData.length);
    ```


***

### getHMTStatistics()

```ts
static getHMTStatistics(networkData: NetworkData, options?: SubgraphOptions): Promise<IHMTStatistics>;
```

This function returns the statistical data of HMToken.

```ts
interface IHMTStatistics {
  totalTransferAmount: bigint;
  totalTransferCount: number;
  totalHolders: number;
};
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `networkData` | [`NetworkData`](../type-aliases/NetworkData.md) | The network information required to connect to the subgraph |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IHMTStatistics` | HMToken statistics data. |

???+ example "Example"

    ```ts
    import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
    
    const networkData = NETWORKS[ChainId.POLYGON_AMOY];
    const hmtStats = await StatisticsUtils.getHMTStatistics(networkData);
    console.log('HMT statistics:', {
      ...hmtStats,
      totalTransferAmount: hmtStats.totalTransferAmount.toString(),
    });
    ```


***

### getHMTHolders()

```ts
static getHMTHolders(
   networkData: NetworkData, 
   params: IHMTHoldersParams, 
options?: SubgraphOptions): Promise<IHMTHolder[]>;
```

This function returns the holders of the HMToken with optional filters and ordering.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `networkData` | [`NetworkData`](../type-aliases/NetworkData.md) | The network information required to connect to the subgraph |
| `params` | `IHMTHoldersParams` | HMT Holders params with filters and ordering |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IHMTHolder[]` | List of HMToken holders. |

???+ example "Example"

    ```ts
    import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
    
    const networkData = NETWORKS[ChainId.POLYGON_AMOY];
    const hmtHolders = await StatisticsUtils.getHMTHolders(networkData, {
      orderDirection: 'asc',
    });
    console.log('HMT holders:', hmtHolders.map((h) => ({
      ...h,
      balance: h.balance.toString(),
    })));
    ```


***

### getHMTDailyData()

```ts
static getHMTDailyData(
   networkData: NetworkData, 
   filter: IStatisticsFilter, 
options?: SubgraphOptions): Promise<IDailyHMT[]>;
```

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

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `networkData` | [`NetworkData`](../type-aliases/NetworkData.md) | The network information required to connect to the subgraph |
| `filter` | `IStatisticsFilter` | Statistics params with duration data |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IDailyHMT[]` | Daily HMToken statistics data. |

???+ example "Example"

    ```ts
    import { StatisticsUtils, ChainId, NETWORKS } from '@human-protocol/sdk';
    
    const networkData = NETWORKS[ChainId.POLYGON_AMOY];
    const dailyHMTStats = await StatisticsUtils.getHMTDailyData(networkData);
    console.log('Daily HMT statistics:', dailyHMTStats);
    
    const hmtStatsRange = await StatisticsUtils.getHMTDailyData(
      networkData,
      {
        from: new Date(2023, 4, 8),
        to: new Date(2023, 5, 8),
      }
    );
    console.log('HMT statistics from 5/8 - 6/8:', hmtStatsRange.length);
    ```

