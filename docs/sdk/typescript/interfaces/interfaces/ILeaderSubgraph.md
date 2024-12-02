[**@human-protocol/sdk**](../../README.md) • **Docs**

***

[@human-protocol/sdk](../../modules.md) / [interfaces](../README.md) / ILeaderSubgraph

# Interface: ILeaderSubgraph

## Extends

- `Omit`\<[`ILeader`](ILeader.md), `"jobTypes"` \| `"reputationNetworks"`\>

## Properties

### address

> **address**: `string`

#### Inherited from

`Omit.address`

#### Defined in

[interfaces.ts:12](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L12)

***

### amountJobsProcessed

> **amountJobsProcessed**: `bigint`

#### Inherited from

`Omit.amountJobsProcessed`

#### Defined in

[interfaces.ts:19](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L19)

***

### amountLocked

> **amountLocked**: `bigint`

#### Inherited from

`Omit.amountLocked`

#### Defined in

[interfaces.ts:14](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L14)

***

### amountSlashed

> **amountSlashed**: `bigint`

#### Inherited from

`Omit.amountSlashed`

#### Defined in

[interfaces.ts:17](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L17)

***

### amountStaked

> **amountStaked**: `bigint`

#### Inherited from

`Omit.amountStaked`

#### Defined in

[interfaces.ts:13](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L13)

***

### amountWithdrawn

> **amountWithdrawn**: `bigint`

#### Inherited from

`Omit.amountWithdrawn`

#### Defined in

[interfaces.ts:16](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L16)

***

### chainId

> **chainId**: [`ChainId`](../../enums/enumerations/ChainId.md)

#### Inherited from

`Omit.chainId`

#### Defined in

[interfaces.ts:11](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L11)

***

### fee?

> `optional` **fee**: `bigint`

#### Inherited from

`Omit.fee`

#### Defined in

[interfaces.ts:21](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L21)

***

### id

> **id**: `string`

#### Inherited from

`Omit.id`

#### Defined in

[interfaces.ts:10](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L10)

***

### jobTypes?

> `optional` **jobTypes**: `string`

#### Defined in

[interfaces.ts:33](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L33)

***

### lockedUntilTimestamp

> **lockedUntilTimestamp**: `bigint`

#### Inherited from

`Omit.lockedUntilTimestamp`

#### Defined in

[interfaces.ts:15](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L15)

***

### publicKey?

> `optional` **publicKey**: `string`

#### Inherited from

`Omit.publicKey`

#### Defined in

[interfaces.ts:22](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L22)

***

### registrationInstructions?

> `optional` **registrationInstructions**: `string`

#### Inherited from

`Omit.registrationInstructions`

#### Defined in

[interfaces.ts:27](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L27)

***

### registrationNeeded?

> `optional` **registrationNeeded**: `boolean`

#### Inherited from

`Omit.registrationNeeded`

#### Defined in

[interfaces.ts:26](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L26)

***

### reputationNetworks?

> `optional` **reputationNetworks**: `object`[]

#### Defined in

[interfaces.ts:34](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L34)

***

### reward

> **reward**: `bigint`

#### Inherited from

`Omit.reward`

#### Defined in

[interfaces.ts:18](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L18)

***

### role?

> `optional` **role**: `string`

#### Inherited from

`Omit.role`

#### Defined in

[interfaces.ts:20](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L20)

***

### url?

> `optional` **url**: `string`

#### Inherited from

`Omit.url`

#### Defined in

[interfaces.ts:24](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L24)

***

### webhookUrl?

> `optional` **webhookUrl**: `string`

#### Inherited from

`Omit.webhookUrl`

#### Defined in

[interfaces.ts:23](https://github.com/humanprotocol/human-protocol/blob/2adb3114c920b5264832199f17e9531ba585c005/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L23)
