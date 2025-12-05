Utility class for escrow-related operations.

## Example

```ts
import { ChainId, EscrowUtils } from '@human-protocol/sdk';

const escrows = await EscrowUtils.getEscrows({
  chainId: ChainId.POLYGON_AMOY
});
console.log('Escrows:', escrows);
```

## Methods

### getEscrows()

```ts
static getEscrows(filter: IEscrowsFilter, options?: SubgraphOptions): Promise<IEscrow[]>;
```

This function returns an array of escrows based on the specified filter parameters.

#### Throws

ErrorInvalidAddress If any filter address is invalid

#### Throws

ErrorUnsupportedChainID If the chain ID is not supported

#### Example

```ts
import { ChainId, EscrowStatus } from '@human-protocol/sdk';

const filters = {
  status: EscrowStatus.Pending,
  from: new Date(2023, 4, 8),
  to: new Date(2023, 5, 8),
  chainId: ChainId.POLYGON_AMOY
};
const escrows = await EscrowUtils.getEscrows(filters);
console.log('Found escrows:', escrows.length);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filter` | `IEscrowsFilter` | Filter parameters. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`IEscrow`[]\>

List of escrows that match the filter.

***

### getEscrow()

```ts
static getEscrow(
   chainId: ChainId, 
   escrowAddress: string, 
options?: SubgraphOptions): Promise<IEscrow | null>;
```

This function returns the escrow data for a given address.

> This uses Subgraph

#### Throws

ErrorUnsupportedChainID If the chain ID is not supported

#### Throws

ErrorInvalidAddress If the escrow address is invalid

#### Example

```ts
import { ChainId } from '@human-protocol/sdk';

const escrow = await EscrowUtils.getEscrow(
  ChainId.POLYGON_AMOY,
  "0x1234567890123456789012345678901234567890"
);
if (escrow) {
  console.log('Escrow status:', escrow.status);
}
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the escrow has been deployed |
| `escrowAddress` | `string` | Address of the escrow |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`IEscrow` \| `null`\>

Escrow data or null if not found.

***

### getStatusEvents()

```ts
static getStatusEvents(filter: IStatusEventFilter, options?: SubgraphOptions): Promise<IStatusEvent[]>;
```

This function returns the status events for a given set of networks within an optional date range.

> This uses Subgraph

#### Throws

ErrorInvalidAddress If the launcher address is invalid

#### Throws

ErrorUnsupportedChainID If the chain ID is not supported

#### Example

```ts
import { ChainId, EscrowStatus } from '@human-protocol/sdk';

const fromDate = new Date('2023-01-01');
const toDate = new Date('2023-12-31');
const statusEvents = await EscrowUtils.getStatusEvents({
  chainId: ChainId.POLYGON,
  statuses: [EscrowStatus.Pending, EscrowStatus.Complete],
  from: fromDate,
  to: toDate
});
console.log('Status events:', statusEvents.length);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filter` | `IStatusEventFilter` | Filter parameters. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`IStatusEvent`[]\>

Array of status events with their corresponding statuses.

***

### getPayouts()

```ts
static getPayouts(filter: IPayoutFilter, options?: SubgraphOptions): Promise<IPayout[]>;
```

This function returns the payouts for a given set of networks.

> This uses Subgraph

#### Throws

ErrorUnsupportedChainID If the chain ID is not supported

#### Throws

ErrorInvalidAddress If any filter address is invalid

#### Example

```ts
import { ChainId } from '@human-protocol/sdk';

const payouts = await EscrowUtils.getPayouts({
  chainId: ChainId.POLYGON,
  escrowAddress: '0x1234567890123456789012345678901234567890',
  recipient: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
  from: new Date('2023-01-01'),
  to: new Date('2023-12-31')
});
console.log('Payouts:', payouts.length);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filter` | `IPayoutFilter` | Filter parameters. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`IPayout`[]\>

List of payouts matching the filters.

***

### getCancellationRefunds()

```ts
static getCancellationRefunds(filter: ICancellationRefundFilter, options?: SubgraphOptions): Promise<ICancellationRefund[]>;
```

This function returns the cancellation refunds for a given set of networks.

> This uses Subgraph

#### Throws

ErrorUnsupportedChainID If the chain ID is not supported

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorInvalidAddress If the receiver address is invalid

#### Example

```ts
import { ChainId } from '@human-protocol/sdk';

const cancellationRefunds = await EscrowUtils.getCancellationRefunds({
   chainId: ChainId.POLYGON_AMOY,
   escrowAddress: '0x1234567890123456789012345678901234567890',
});
console.log('Cancellation refunds:', cancellationRefunds.length);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filter` | `ICancellationRefundFilter` | Filter parameters. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`ICancellationRefund`[]\>

List of cancellation refunds matching the filters.

***

### getCancellationRefund()

```ts
static getCancellationRefund(
   chainId: ChainId, 
   escrowAddress: string, 
options?: SubgraphOptions): Promise<ICancellationRefund | null>;
```

This function returns the cancellation refund for a given escrow address.

> This uses Subgraph

#### Throws

ErrorUnsupportedChainID If the chain ID is not supported

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Example

```ts
import { ChainId } from '@human-protocol/sdk';

const cancellationRefund = await EscrowUtils.getCancellationRefund(
  ChainId.POLYGON_AMOY,
  "0x1234567890123456789012345678901234567890"
);
if (cancellationRefund) {
  console.log('Refund amount:', cancellationRefund.amount);
}
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the escrow has been deployed |
| `escrowAddress` | `string` | Address of the escrow |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`ICancellationRefund` \| `null`\>

Cancellation refund data or null if not found.
