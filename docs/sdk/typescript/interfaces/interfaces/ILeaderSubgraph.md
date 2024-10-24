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

[interfaces.ts:12](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L12)

***

### amountAllocated

> **amountAllocated**: `bigint`

#### Inherited from

`Omit.amountAllocated`

#### Defined in

[interfaces.ts:14](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L14)

***

### amountJobsProcessed

> **amountJobsProcessed**: `bigint`

#### Inherited from

`Omit.amountJobsProcessed`

#### Defined in

[interfaces.ts:20](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L20)

***

### amountLocked

> **amountLocked**: `bigint`

#### Inherited from

`Omit.amountLocked`

#### Defined in

[interfaces.ts:15](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L15)

***

### amountSlashed

> **amountSlashed**: `bigint`

#### Inherited from

`Omit.amountSlashed`

#### Defined in

[interfaces.ts:18](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L18)

***

### amountStaked

> **amountStaked**: `bigint`

#### Inherited from

`Omit.amountStaked`

#### Defined in

[interfaces.ts:13](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L13)

***

### amountWithdrawn

> **amountWithdrawn**: `bigint`

#### Inherited from

`Omit.amountWithdrawn`

#### Defined in

[interfaces.ts:17](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L17)

***

### chainId

> **chainId**: [`ChainId`](../../enums/enumerations/ChainId.md)

#### Inherited from

`Omit.chainId`

#### Defined in

[interfaces.ts:11](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L11)

***

### fee?

> `optional` **fee**: `bigint`

#### Inherited from

`Omit.fee`

#### Defined in

[interfaces.ts:22](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L22)

***

### id

> **id**: `string`

#### Inherited from

`Omit.id`

#### Defined in

[interfaces.ts:10](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L10)

***

### jobTypes?

> `optional` **jobTypes**: `string`

#### Defined in

[interfaces.ts:34](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L34)

***

### lockedUntilTimestamp

> **lockedUntilTimestamp**: `bigint`

#### Inherited from

`Omit.lockedUntilTimestamp`

#### Defined in

[interfaces.ts:16](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L16)

***

### publicKey?

> `optional` **publicKey**: `string`

#### Inherited from

`Omit.publicKey`

#### Defined in

[interfaces.ts:23](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L23)

***

### registrationInstructions?

> `optional` **registrationInstructions**: `string`

#### Inherited from

`Omit.registrationInstructions`

#### Defined in

[interfaces.ts:28](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L28)

***

### registrationNeeded?

> `optional` **registrationNeeded**: `boolean`

#### Inherited from

`Omit.registrationNeeded`

#### Defined in

[interfaces.ts:27](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L27)

***

### reputationNetworks?

> `optional` **reputationNetworks**: `object`[]

#### Defined in

[interfaces.ts:35](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L35)

***

### reward

> **reward**: `bigint`

#### Inherited from

`Omit.reward`

#### Defined in

[interfaces.ts:19](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L19)

***

### role?

> `optional` **role**: `string`

#### Inherited from

`Omit.role`

#### Defined in

[interfaces.ts:21](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L21)

***

### url?

> `optional` **url**: `string`

#### Inherited from

`Omit.url`

#### Defined in

[interfaces.ts:25](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L25)

***

### webhookUrl?

> `optional` **webhookUrl**: `string`

#### Inherited from

`Omit.webhookUrl`

#### Defined in

[interfaces.ts:24](https://github.com/humanprotocol/human-protocol/blob/c89cf662f1f49999499468fbc2c62e830c1f474a/packages/sdk/typescript/human-protocol-sdk/src/interfaces.ts#L24)
