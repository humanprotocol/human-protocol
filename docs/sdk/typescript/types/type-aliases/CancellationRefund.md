[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [types](../README.md) / CancellationRefund

# Type Alias: CancellationRefund

> **CancellationRefund** = `object`

Defined in: [types.ts:193](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L193)

Represents a cancellation refund event.

## Properties

### amount

> **amount**: `bigint`

Defined in: [types.ts:209](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L209)

The amount refunded to the receiver.

***

### block

> **block**: `number`

Defined in: [types.ts:214](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L214)

The block number in which the cancellation refund event occurred.

***

### escrowAddress

> **escrowAddress**: `string`

Defined in: [types.ts:201](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L201)

The address of the escrow associated with the cancellation refund.

***

### id

> **id**: `string`

Defined in: [types.ts:197](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L197)

Unique identifier of the cancellation refund event.

***

### receiver

> **receiver**: `string`

Defined in: [types.ts:205](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L205)

The address of the receiver who received the refund.

***

### timestamp

> **timestamp**: `number`

Defined in: [types.ts:218](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L218)

The timestamp when the cancellation refund event occurred (in UNIX format).

***

### txHash

> **txHash**: `string`

Defined in: [types.ts:222](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L222)

The transaction hash of the cancellation refund event.
