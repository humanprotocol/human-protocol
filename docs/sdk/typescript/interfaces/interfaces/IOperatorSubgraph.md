[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [interfaces](../README.md) / IOperatorSubgraph

# Interface: IOperatorSubgraph

Defined in: [interfaces.ts:34](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L34)

## Extends

- `Omit`\<[`IOperator`](IOperator.md), `"jobTypes"` \| `"reputationNetworks"` \| `"chainId"` \| `"amountStaked"` \| `"amountLocked"` \| `"lockedUntilTimestamp"` \| `"amountWithdrawn"` \| `"amountSlashed"` \| `"lastDepositTimestamp"`\>

## Properties

### address

> **address**: `string`

Defined in: [interfaces.ts:12](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L12)

#### Inherited from

`Omit.address`

***

### amountJobsProcessed

> **amountJobsProcessed**: `bigint`

Defined in: [interfaces.ts:19](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L19)

#### Inherited from

`Omit.amountJobsProcessed`

***

### category?

> `optional` **category**: `string`

Defined in: [interfaces.ts:31](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L31)

#### Inherited from

`Omit.category`

***

### fee?

> `optional` **fee**: `bigint`

Defined in: [interfaces.ts:21](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L21)

#### Inherited from

`Omit.fee`

***

### id

> **id**: `string`

Defined in: [interfaces.ts:10](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L10)

#### Inherited from

`Omit.id`

***

### jobTypes?

> `optional` **jobTypes**: `string`

Defined in: [interfaces.ts:47](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L47)

***

### name?

> `optional` **name**: `string`

Defined in: [interfaces.ts:30](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L30)

#### Inherited from

`Omit.name`

***

### publicKey?

> `optional` **publicKey**: `string`

Defined in: [interfaces.ts:22](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L22)

#### Inherited from

`Omit.publicKey`

***

### registrationInstructions?

> `optional` **registrationInstructions**: `string`

Defined in: [interfaces.ts:28](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L28)

#### Inherited from

`Omit.registrationInstructions`

***

### registrationNeeded?

> `optional` **registrationNeeded**: `boolean`

Defined in: [interfaces.ts:27](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L27)

#### Inherited from

`Omit.registrationNeeded`

***

### reputationNetworks?

> `optional` **reputationNetworks**: `object`[]

Defined in: [interfaces.ts:48](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L48)

#### address

> **address**: `string`

***

### role?

> `optional` **role**: `string`

Defined in: [interfaces.ts:20](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L20)

#### Inherited from

`Omit.role`

***

### staker?

> `optional` **staker**: `object`

Defined in: [interfaces.ts:49](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L49)

#### lastDepositTimestamp

> **lastDepositTimestamp**: `bigint`

#### lockedAmount

> **lockedAmount**: `bigint`

#### lockedUntilTimestamp

> **lockedUntilTimestamp**: `bigint`

#### slashedAmount

> **slashedAmount**: `bigint`

#### stakedAmount

> **stakedAmount**: `bigint`

#### withdrawnAmount

> **withdrawnAmount**: `bigint`

***

### url?

> `optional` **url**: `string`

Defined in: [interfaces.ts:25](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L25)

#### Inherited from

`Omit.url`

***

### webhookUrl?

> `optional` **webhookUrl**: `string`

Defined in: [interfaces.ts:23](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L23)

#### Inherited from

`Omit.webhookUrl`

***

### website?

> `optional` **website**: `string`

Defined in: [interfaces.ts:24](https://github.com/humanprotocol/human-protocol/blob/88e4c1f607516180a13d25af6568a51a409bcb1d/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L24)

#### Inherited from

`Omit.website`
