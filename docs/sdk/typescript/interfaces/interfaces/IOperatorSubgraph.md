[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [interfaces](../README.md) / IOperatorSubgraph

# Interface: IOperatorSubgraph

## Extends

- `Omit`\<[`IOperator`](IOperator.md), `"jobTypes"` \| `"reputationNetworks"` \| `"chainId"`\>

## Properties

### address

> **address**: `string`

#### Inherited from

`Omit.address`

#### Defined in

<<<<<<< HEAD
[interfaces.ts:12](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L12)

***

### amountJobsProcessed

> **amountJobsProcessed**: `bigint`

#### Inherited from

`Omit.amountJobsProcessed`

#### Defined in

[interfaces.ts:19](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L19)

***

### amountLocked

> **amountLocked**: `bigint`

#### Inherited from

`Omit.amountLocked`

#### Defined in

[interfaces.ts:14](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L14)

***

### amountSlashed

> **amountSlashed**: `bigint`

#### Inherited from

`Omit.amountSlashed`

#### Defined in

[interfaces.ts:17](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L17)

***

### amountStaked

> **amountStaked**: `bigint`

#### Inherited from

`Omit.amountStaked`

#### Defined in

[interfaces.ts:13](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L13)

***

### amountWithdrawn

> **amountWithdrawn**: `bigint`

#### Inherited from

`Omit.amountWithdrawn`

#### Defined in

[interfaces.ts:16](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L16)

***

### category?

> `optional` **category**: `string`

#### Inherited from

`Omit.category`

#### Defined in

[interfaces.ts:31](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L31)

***

### fee?

> `optional` **fee**: `bigint`

#### Inherited from

`Omit.fee`

#### Defined in

[interfaces.ts:21](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L21)

***

### id

> **id**: `string`

#### Inherited from

`Omit.id`

#### Defined in

[interfaces.ts:10](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L10)
=======
[interfaces.ts:59](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L59)
>>>>>>> develop

***

### jobTypes?

> `optional` **jobTypes**: `string`

#### Defined in

<<<<<<< HEAD
[interfaces.ts:36](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L36)

***

### lockedUntilTimestamp

> **lockedUntilTimestamp**: `bigint`

#### Inherited from

`Omit.lockedUntilTimestamp`

#### Defined in

[interfaces.ts:15](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L15)

***

### name?

> `optional` **name**: `string`

#### Inherited from

`Omit.name`

#### Defined in

[interfaces.ts:30](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L30)

***

### publicKey?

> `optional` **publicKey**: `string`

#### Inherited from

`Omit.publicKey`

#### Defined in

[interfaces.ts:22](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L22)
=======
[interfaces.ts:68](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L68)
>>>>>>> develop

***

### registrationInstructions?

> `optional` **registrationInstructions**: `string`

#### Inherited from

`Omit.registrationInstructions`

#### Defined in

<<<<<<< HEAD
[interfaces.ts:28](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L28)
=======
[interfaces.ts:64](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L64)
>>>>>>> develop

***

### registrationNeeded?

> `optional` **registrationNeeded**: `boolean`

#### Inherited from

`Omit.registrationNeeded`

#### Defined in

<<<<<<< HEAD
[interfaces.ts:27](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L27)

***

### reputationNetworks?

> `optional` **reputationNetworks**: `object`[]

#### Defined in

[interfaces.ts:37](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L37)

***

### reward

> **reward**: `bigint`

#### Inherited from

`Omit.reward`

#### Defined in

[interfaces.ts:18](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L18)
=======
[interfaces.ts:63](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L63)
>>>>>>> develop

***

### role?

> `optional` **role**: `string`

#### Inherited from

`Omit.role`

#### Defined in

<<<<<<< HEAD
[interfaces.ts:20](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L20)
=======
[interfaces.ts:60](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L60)
>>>>>>> develop

***

### url?

> `optional` **url**: `string`

#### Inherited from

`Omit.url`

#### Defined in

<<<<<<< HEAD
[interfaces.ts:25](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L25)

***

### webhookUrl?

> `optional` **webhookUrl**: `string`

#### Inherited from

`Omit.webhookUrl`

#### Defined in

[interfaces.ts:23](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L23)

***

### website?

> `optional` **website**: `string`

#### Inherited from

`Omit.website`

#### Defined in

[interfaces.ts:24](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L24)
=======
[interfaces.ts:61](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L61)
>>>>>>> develop
