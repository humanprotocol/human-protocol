Utility class for worker-related operations.

## Example

```ts
import { WorkerUtils, ChainId } from '@human-protocol/sdk';

const worker = await WorkerUtils.getWorker(
  ChainId.POLYGON_AMOY,
  '0x1234567890abcdef1234567890abcdef12345678'
);
console.log('Worker:', worker);
```

## Methods

### getWorker()

```ts
static getWorker(
   chainId: ChainId, 
   address: string, 
options?: SubgraphOptions): Promise<IWorker | null>;
```

This function returns the worker data for the given address.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | The chain ID. |
| `address` | `string` | The worker address. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IWorker \| null` | Returns the worker details or null if not found. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorUnsupportedChainID` | If the chain ID is not supported |
| `ErrorInvalidAddress` | If the address is invalid |

???+ example "Example"

    ```ts
    import { WorkerUtils, ChainId } from '@human-protocol/sdk';
    
    const worker = await WorkerUtils.getWorker(
      ChainId.POLYGON_AMOY,
      '0x1234567890abcdef1234567890abcdef12345678'
    );
    console.log('Worker:', worker);
    ```


***

### getWorkers()

```ts
static getWorkers(filter: IWorkersFilter, options?: SubgraphOptions): Promise<IWorker[]>;
```

This function returns all worker details based on the provided filter.

**Input parameters**

```ts
interface IWorkersFilter {
  chainId: ChainId; // List of chain IDs to query.
  address?: string; // (Optional) The worker address to filter by.
  orderBy?: string; // (Optional) The field to order by. Default is 'payoutCount'.
  orderDirection?: OrderDirection; // (Optional) The direction of the order. Default is 'DESC'.
  first?: number; // (Optional) Number of workers per page. Default is 10.
  skip?: number; // (Optional) Number of workers to skip. Default is 0.
}
```

```ts
type IWorker = {
  id: string;
  address: string;
  totalHMTAmountReceived: bigint;
  payoutCount: number;
};
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filter` | `IWorkersFilter` | Filter for the workers. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IWorker[]` | Returns an array with all the worker details. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorUnsupportedChainID` | If the chain ID is not supported |
| `ErrorInvalidAddress` | If the filter address is invalid |

???+ example "Example"

    ```ts
    import { WorkerUtils, ChainId } from '@human-protocol/sdk';
    
    const filter = {
      chainId: ChainId.POLYGON_AMOY,
      first: 10,
      skip: 0,
    };
    const workers = await WorkerUtils.getWorkers(filter);
    console.log('Workers:', workers.length);
    ```

