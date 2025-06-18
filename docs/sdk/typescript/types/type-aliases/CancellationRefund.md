[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [types](../README.md) / CancellationRefund

# Type Alias: CancellationRefund

> **CancellationRefund** = `object`

Defined in: [types.ts:195](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L195)

Represents a cancellation refund event.

## Properties

### amount

> **amount**: `bigint`

Defined in: [types.ts:211](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L211)

The amount refunded to the receiver.

***

### block

> **block**: `number`

Defined in: [types.ts:216](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L216)

The block number in which the cancellation refund event occurred.

***

### escrowAddress

> **escrowAddress**: `string`

Defined in: [types.ts:203](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L203)

The address of the escrow associated with the cancellation refund.

***

### id

> **id**: `string`

Defined in: [types.ts:199](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L199)

Unique identifier of the cancellation refund event.

***

### receiver

> **receiver**: `string`

Defined in: [types.ts:207](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L207)

The address of the receiver who received the refund.

***

### timestamp

> **timestamp**: `number`

Defined in: [types.ts:220](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L220)

The timestamp when the cancellation refund event occurred (in UNIX format).

***

### txHash

> **txHash**: `string`

Defined in: [types.ts:224](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L224)

The transaction hash of the cancellation refund event.
