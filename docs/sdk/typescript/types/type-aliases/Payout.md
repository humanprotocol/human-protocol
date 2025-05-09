[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [types](../README.md) / Payout

# Type Alias: Payout

> **Payout**: `object`

Defined in: [types.ts:177](https://github.com/humanprotocol/human-protocol/blob/d770e8f228f083f5eba0523ebbdff361b3188c3d/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L177)

Represents a payout from an escrow.

## Type declaration

### amount

> **amount**: `bigint`

The amount paid to the recipient.

### createdAt

> **createdAt**: `number`

The timestamp when the payout was created (in UNIX format).

### escrowAddress

> **escrowAddress**: `string`

The address of the escrow associated with the payout.

### id

> **id**: `string`

Unique identifier of the payout.

### recipient

> **recipient**: `string`

The address of the recipient who received the payout.
