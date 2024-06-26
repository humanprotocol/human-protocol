[**@human-protocol/sdk**](../../README.md) • **Docs**

***

[@human-protocol/sdk](../../modules.md) / [transaction](../README.md) / TransactionUtils

# Class: TransactionUtils

## Constructors

### new TransactionUtils()

> **new TransactionUtils**(): [`TransactionUtils`](TransactionUtils.md)

#### Returns

[`TransactionUtils`](TransactionUtils.md)

## Methods

### getTransaction()

> `static` **getTransaction**(`chainId`, `hash`): `Promise`\<`ITransaction`\>

This function returns the transaction data for the given hash.

#### Parameters

• **chainId**: `ChainId`

The chain ID.

• **hash**: `string`

The transaction hash.

#### Returns

`Promise`\<`ITransaction`\>

Returns the transaction details.

**Code example**

```ts
import { TransactionUtils, ChainId } from '@human-protocol/sdk';

const transaction = await TransactionUtils.getTransaction(ChainId.POLYGON, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Source

[transaction.ts:34](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/transaction.ts#L34)

***

### getTransactions()

> `static` **getTransactions**(`filter`): `Promise`\<`ITransaction`[]\>

This function returns all transaction details based on the provided filter.

> This uses Subgraph

**Input parameters**

```ts
interface ITransactionsFilter {
  networks: ChainId[]; // List of chain IDs to query.
  fromAddress?: string; // (Optional) The address from which transactions are sent.
  toAddress?: string; // (Optional) The address to which transactions are sent.
  startDate?: Date; // (Optional) The start date to filter transactions (inclusive).
  endDate?: Date; // (Optional) The end date to filter transactions (inclusive).
  startBlock?: number; // (Optional) The start block number to filter transactions (inclusive).
  endBlock?: number; // (Optional) The end block number to filter transactions (inclusive).
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

• **filter**: `ITransactionsFilter`

Filter for the transactions.

#### Returns

`Promise`\<`ITransaction`[]\>

Returns an array with all the transaction details.

**Code example**

```ts
import { TransactionUtils, ChainId } from '@human-protocol/sdk';

const filter: ITransactionsFilter = {
  networks: [ChainId.POLYGON],
  startDate: new Date('2022-01-01'),
  endDate: new Date('2022-12-31')
};
const transactions = await TransactionUtils.getTransactions(filter);
```

#### Source

[transaction.ts:103](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/transaction.ts#L103)
