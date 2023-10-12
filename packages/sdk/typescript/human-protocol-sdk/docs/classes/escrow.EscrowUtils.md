[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [escrow](../modules/escrow.md) / EscrowUtils

# Class: EscrowUtils

[escrow](../modules/escrow.md).EscrowUtils

## Table of contents

### Constructors

- [constructor](escrow.EscrowUtils.md#constructor)

### Methods

- [getEscrow](escrow.EscrowUtils.md#getescrow)
- [getEscrows](escrow.EscrowUtils.md#getescrows)

## Constructors

### constructor

• **new EscrowUtils**()

## Methods

### getEscrow

▸ `Static` **getEscrow**(`chainId`, `escrowAddress`): `Promise`<`EscrowData`\>

Returns the escrow for a given address

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `ChainId` | Chain id. |
| `escrowAddress` | `string` | Escrow address. |

#### Returns

`Promise`<`EscrowData`\>

**`Throws`**

- An error object if an error occurred.

#### Defined in

[escrow.ts:1422](https://github.com/humanprotocol/human-protocol/blob/04b5bdf5/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1422)

___

### getEscrows

▸ `Static` **getEscrows**(`filter`): `Promise`<`EscrowData`[]\>

Returns the list of escrows for given filter

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `filter` | `IEscrowsFilter` | Filter parameters. |

#### Returns

`Promise`<`EscrowData`[]\>

**`Throws`**

- An error object if an error occurred.

#### Defined in

[escrow.ts:1350](https://github.com/humanprotocol/human-protocol/blob/04b5bdf5/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1350)
