[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [types](../README.md) / Payout

# Type Alias: Payout

> **Payout** = `object`

Defined in: [types.ts:167](https://github.com/humanprotocol/human-protocol/blob/c6ab6b31903af39ac6b3e92bd60cecc017b01413/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L167)

Represents a payout from an escrow.

## Properties

### amount

> **amount**: `bigint`

Defined in: [types.ts:183](https://github.com/humanprotocol/human-protocol/blob/c6ab6b31903af39ac6b3e92bd60cecc017b01413/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L183)

The amount paid to the recipient.

***

### createdAt

> **createdAt**: `number`

Defined in: [types.ts:187](https://github.com/humanprotocol/human-protocol/blob/c6ab6b31903af39ac6b3e92bd60cecc017b01413/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L187)

The timestamp when the payout was created (in UNIX format).

***

### escrowAddress

> **escrowAddress**: `string`

Defined in: [types.ts:175](https://github.com/humanprotocol/human-protocol/blob/c6ab6b31903af39ac6b3e92bd60cecc017b01413/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L175)

The address of the escrow associated with the payout.

***

### id

> **id**: `string`

Defined in: [types.ts:171](https://github.com/humanprotocol/human-protocol/blob/c6ab6b31903af39ac6b3e92bd60cecc017b01413/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L171)

Unique identifier of the payout.

***

### recipient

> **recipient**: `string`

Defined in: [types.ts:179](https://github.com/humanprotocol/human-protocol/blob/c6ab6b31903af39ac6b3e92bd60cecc017b01413/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L179)

The address of the recipient who received the payout.
