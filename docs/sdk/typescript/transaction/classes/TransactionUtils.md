[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [transaction](../README.md) / TransactionUtils

# Class: TransactionUtils

Defined in: [transaction.ts:18](https://github.com/humanprotocol/human-protocol/blob/1fed10bebf38e474662f3001345d050ccf6fda2f/packages/sdk/typescript/human-protocol-sdk/src/transaction.ts#L18)

## Constructors

### new TransactionUtils()

> **new TransactionUtils**(): [`TransactionUtils`](TransactionUtils.md)

#### Returns

[`TransactionUtils`](TransactionUtils.md)

## Methods

### getTransaction()

> `static` **getTransaction**(`chainId`, `hash`): `Promise`\<[`ITransaction`](../../interfaces/interfaces/ITransaction.md)\>

Defined in: [transaction.ts:34](https://github.com/humanprotocol/human-protocol/blob/1fed10bebf38e474662f3001345d050ccf6fda2f/packages/sdk/typescript/human-protocol-sdk/src/transaction.ts#L34)

This function returns the transaction data for the given hash.

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

Defined in: [transaction.ts:109](https://github.com/humanprotocol/human-protocol/blob/1fed10bebf38e474662f3001345d050ccf6fda2f/packages/sdk/typescript/human-protocol-sdk/src/transaction.ts#L109)

This function returns all transaction details based on the provided filter.

> This uses Subgraph

**Input parameters**

```ts
interface ITransactionsFilter {
  chainId: ChainId; // List of chain IDs to query.
  fromAddress?: string; // (Optional) The address from which transactions are sent.
  toAddress?: string; // (Optional) The address to which transactions are sent.
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
  block: number;
  txHash: string;
  from: string;
  to: string;
  timestamp: number;
  value: string;
  method: string;
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
