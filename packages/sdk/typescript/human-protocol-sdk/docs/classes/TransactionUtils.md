Utility class for transaction-related operations.

## Example

```ts
import { TransactionUtils, ChainId } from '@human-protocol/sdk';

const transaction = await TransactionUtils.getTransaction(
  ChainId.POLYGON_AMOY,
  '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
);
console.log('Transaction:', transaction);
```

## Methods

### getTransaction()

```ts
static getTransaction(
   chainId: ChainId, 
   hash: string, 
options?: SubgraphOptions): Promise<ITransaction | null>;
```

This function returns the transaction data for the given hash.

```ts
type ITransaction = {
  block: bigint;
  txHash: string;
  from: string;
  to: string;
  timestamp: bigint;
  value: bigint;
  method: string;
  receiver?: string;
  escrow?: string;
  token?: string;
  internalTransactions: InternalTransaction[];
};
```

```ts
type InternalTransaction = {
 from: string;
 to: string;
 value: bigint;
 method: string;
 receiver?: string;
 escrow?: string;
 token?: string;
};
```

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidHashProvided` | If the hash is invalid |
| `ErrorUnsupportedChainID` | If the chain ID is not supported |

#### Example

```ts
import { TransactionUtils, ChainId } from '@human-protocol/sdk';

const transaction = await TransactionUtils.getTransaction(
  ChainId.POLYGON_AMOY,
  '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
);
console.log('Transaction:', transaction);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | The chain ID. |
| `hash` | `string` | The transaction hash. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

| Type | Description |
|------|-------------|
| `ITransaction \| null` | Returns the transaction details or null if not found. |

***

### getTransactions()

```ts
static getTransactions(filter: ITransactionsFilter, options?: SubgraphOptions): Promise<ITransaction[]>;
```

This function returns all transaction details based on the provided filter.

> This uses Subgraph

**Input parameters**

```ts
interface ITransactionsFilter {
  chainId: ChainId; // List of chain IDs to query.
  fromAddress?: string; // (Optional) The address from which transactions are sent.
  toAddress?: string; // (Optional) The address to which transactions are sent.
  method?: string; // (Optional) The method of the transaction to filter by.
  escrow?: string; // (Optional) The escrow address to filter transactions.
  token?: string; // (Optional) The token address to filter transactions.
  startDate?: Date; // (Optional) The start date to filter transactions (inclusive).
  endDate?: Date; // (Optional) The end date to filter transactions (inclusive).
  startBlock?: number; // (Optional) The start block number to filter transactions (inclusive).
  endBlock?: number; // (Optional) The end block number to filter transactions (inclusive).
  first?: number; // (Optional) Number of transactions per page. Default is 10.
  skip?: number; // (Optional) Number of transactions to skip. Default is 0.
  orderDirection?: OrderDirection; // (Optional) Order of the results. Default is DESC.
}
```

```ts
type InternalTransaction = {
 from: string;
 to: string;
 value: bigint;
 method: string;
 receiver?: string;
 escrow?: string;
 token?: string;
};
```

```ts
type ITransaction = {
  block: bigint;
  txHash: string;
  from: string;
  to: string;
  timestamp: bigint;
  value: bigint;
  method: string;
  receiver?: string;
  escrow?: string;
  token?: string;
  internalTransactions: InternalTransaction[];
};
```

#### Throws

| Type | Description |
|------|-------------|
| `ErrorCannotUseDateAndBlockSimultaneously` | If both date and block filters are used |
| `ErrorUnsupportedChainID` | If the chain ID is not supported |

#### Example

```ts
import { TransactionUtils, ChainId, OrderDirection } from '@human-protocol/sdk';

const filter = {
  chainId: ChainId.POLYGON_AMOY,
  startDate: new Date('2022-01-01'),
  endDate: new Date('2022-12-31'),
  first: 10,
  skip: 0,
  orderDirection: OrderDirection.DESC,
};
const transactions = await TransactionUtils.getTransactions(filter);
console.log('Transactions:', transactions.length);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filter` | `ITransactionsFilter` | Filter for the transactions. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

| Type | Description |
|------|-------------|
| `ITransaction[]` | Returns an array with all the transaction details. |
