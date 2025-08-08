[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [transaction](../README.md) / TransactionUtils

# Class: TransactionUtils

Defined in: [transaction.ts:18](https://github.com/humanprotocol/human-protocol/blob/5b6e90353814741f056deb2914334a3c4fbc279d/packages/sdk/typescript/human-protocol-sdk/src/transaction.ts#L18)

## Constructors

### Constructor

> **new TransactionUtils**(): `TransactionUtils`

#### Returns

`TransactionUtils`

## Methods

### getTransaction()

> `static` **getTransaction**(`chainId`, `hash`): `Promise`\<[`ITransaction`](../../interfaces/interfaces/ITransaction.md)\>

Defined in: [transaction.ts:50](https://github.com/humanprotocol/human-protocol/blob/5b6e90353814741f056deb2914334a3c4fbc279d/packages/sdk/typescript/human-protocol-sdk/src/transaction.ts#L50)

This function returns the transaction data for the given hash.

```ts
type ITransaction = {
  block: bigint;
  txHash: string;
  from: string;
  to: string;
  timestamp: bigint;
  value: string;
  method: string;
  receiver?: string;
  escrow?: string;
  token?: string;
  internalTransactions: InternalTransaction[];
};
```

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

The chain ID.

##### hash

`string`

The transaction hash.

#### Returns

`Promise`\<[`ITransaction`](../../interfaces/interfaces/ITransaction.md)\>

Returns the transaction details.

**Code example**

```ts
import { TransactionUtils, ChainId } from '@human-protocol/sdk';

const transaction = await TransactionUtils.getTransaction(ChainId.POLYGON, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getTransactions()

> `static` **getTransactions**(`filter`): `Promise`\<[`ITransaction`](../../interfaces/interfaces/ITransaction.md)[]\>

Defined in: [transaction.ts:132](https://github.com/humanprotocol/human-protocol/blob/5b6e90353814741f056deb2914334a3c4fbc279d/packages/sdk/typescript/human-protocol-sdk/src/transaction.ts#L132)

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
type ITransaction = {
  block: bigint;
  txHash: string;
  from: string;
  to: string;
  timestamp: bigint;
  value: string;
  method: string;
  receiver?: string;
  escrow?: string;
  token?: string;
  internalTransactions: InternalTransaction[];
};
```

#### Parameters

##### filter

[`ITransactionsFilter`](../../interfaces/interfaces/ITransactionsFilter.md)

Filter for the transactions.

#### Returns

`Promise`\<[`ITransaction`](../../interfaces/interfaces/ITransaction.md)[]\>

Returns an array with all the transaction details.

**Code example**

```ts
import { TransactionUtils, ChainId, OrderDirection } from '@human-protocol/sdk';

const filter: ITransactionsFilter = {
  chainId: ChainId.POLYGON,
  startDate: new Date('2022-01-01'),
  endDate: new Date('2022-12-31'),
  first: 10,
  skip: 0,
  orderDirection: OrderDirection.DESC,
};
const transactions = await TransactionUtils.getTransactions(filter);
```
