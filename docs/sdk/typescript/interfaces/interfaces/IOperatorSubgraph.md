[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [interfaces](../README.md) / IOperatorSubgraph

# Interface: IOperatorSubgraph

Defined in: [interfaces.ts:34](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L34)

## Extends

- `Omit`\<[`IOperator`](IOperator.md), `"jobTypes"` \| `"reputationNetworks"` \| `"chainId"`\>

## Properties

### address

> **address**: `string`

Defined in: [interfaces.ts:12](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L12)

#### Inherited from

`Omit.address`

***

### amountJobsProcessed

> **amountJobsProcessed**: `bigint`

Defined in: [interfaces.ts:19](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L19)

#### Inherited from

`Omit.amountJobsProcessed`

***

### amountLocked

> **amountLocked**: `bigint`

Defined in: [interfaces.ts:14](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L14)

#### Inherited from

`Omit.amountLocked`

***

### amountSlashed

> **amountSlashed**: `bigint`

Defined in: [interfaces.ts:17](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L17)

#### Inherited from

`Omit.amountSlashed`

***

### amountStaked

> **amountStaked**: `bigint`

Defined in: [interfaces.ts:13](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L13)

#### Inherited from

`Omit.amountStaked`

***

### amountWithdrawn

> **amountWithdrawn**: `bigint`

Defined in: [interfaces.ts:16](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L16)

#### Inherited from

`Omit.amountWithdrawn`

***

### category?

> `optional` **category**: `string`

Defined in: [interfaces.ts:31](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L31)

#### Inherited from

`Omit.category`

***

### fee?

> `optional` **fee**: `bigint`

Defined in: [interfaces.ts:21](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L21)

#### Inherited from

`Omit.fee`

***

### id

> **id**: `string`

Defined in: [interfaces.ts:10](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L10)

#### Inherited from

`Omit.id`

***

### jobTypes?

> `optional` **jobTypes**: `string`

Defined in: [interfaces.ts:36](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L36)

***

### lockedUntilTimestamp

> **lockedUntilTimestamp**: `bigint`

Defined in: [interfaces.ts:15](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L15)

#### Inherited from

`Omit.lockedUntilTimestamp`

***

### name?

> `optional` **name**: `string`

Defined in: [interfaces.ts:30](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L30)

#### Inherited from

`Omit.name`

***

### publicKey?

> `optional` **publicKey**: `string`

Defined in: [interfaces.ts:22](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L22)

#### Inherited from

`Omit.publicKey`

***

### registrationInstructions?

> `optional` **registrationInstructions**: `string`

Defined in: [interfaces.ts:28](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L28)

#### Inherited from

`Omit.registrationInstructions`

***

### registrationNeeded?

> `optional` **registrationNeeded**: `boolean`

Defined in: [interfaces.ts:27](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L27)

#### Inherited from

`Omit.registrationNeeded`

***

### reputationNetworks?

> `optional` **reputationNetworks**: `object`[]

Defined in: [interfaces.ts:37](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L37)

#### address

> **address**: `string`

***

### reward

> **reward**: `bigint`

Defined in: [interfaces.ts:18](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L18)

#### Inherited from

`Omit.reward`

***

### role?

> `optional` **role**: `string`

Defined in: [interfaces.ts:20](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L20)

#### Inherited from

`Omit.role`

***

### url?

> `optional` **url**: `string`

Defined in: [interfaces.ts:25](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L25)

#### Inherited from

`Omit.url`

***

### webhookUrl?

> `optional` **webhookUrl**: `string`

Defined in: [interfaces.ts:23](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L23)

#### Inherited from

`Omit.webhookUrl`

***

### website?

> `optional` **website**: `string`

Defined in: [interfaces.ts:24](https://github.com/humanprotocol/human-protocol/blob/4856a3f52f40cebc5467b639c48c93c09d17622b/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L24)

#### Inherited from

`Omit.website`
