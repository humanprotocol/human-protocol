[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [types](../README.md) / Payout

# Type Alias: Payout

> **Payout** = `object`

Defined in: [types.ts:177](https://github.com/humanprotocol/human-protocol/blob/a3c69981844e7ed43743f2459713fe069fcbb283/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L177)

Represents a payout from an escrow.

## Properties

### amount

> **amount**: `bigint`

Defined in: [types.ts:193](https://github.com/humanprotocol/human-protocol/blob/a3c69981844e7ed43743f2459713fe069fcbb283/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L193)

The amount paid to the recipient.

***

### createdAt

> **createdAt**: `number`

Defined in: [types.ts:197](https://github.com/humanprotocol/human-protocol/blob/a3c69981844e7ed43743f2459713fe069fcbb283/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L197)

The timestamp when the payout was created (in UNIX format).

***

### escrowAddress

> **escrowAddress**: `string`

Defined in: [types.ts:185](https://github.com/humanprotocol/human-protocol/blob/a3c69981844e7ed43743f2459713fe069fcbb283/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L185)

The address of the escrow associated with the payout.

***

### id

> **id**: `string`

Defined in: [types.ts:181](https://github.com/humanprotocol/human-protocol/blob/a3c69981844e7ed43743f2459713fe069fcbb283/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L181)

Unique identifier of the payout.

***

### recipient

> **recipient**: `string`

Defined in: [types.ts:189](https://github.com/humanprotocol/human-protocol/blob/a3c69981844e7ed43743f2459713fe069fcbb283/packages/sdk/typescript/human-protocol-sdk/src/types.ts#L189)

The address of the recipient who received the payout.
