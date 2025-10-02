[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [staking](../README.md) / StakingUtils

# Class: StakingUtils

Defined in: [staking.ts:491](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L491)

Utility class for Staking-related subgraph queries.

## Constructors

### Constructor

> **new StakingUtils**(): `StakingUtils`

#### Returns

`StakingUtils`

## Methods

### getStaker()

> `static` **getStaker**(`chainId`, `stakerAddress`): `Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)\>

Defined in: [staking.ts:499](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L499)

Gets staking info for a staker from the subgraph.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the staking contract is deployed

##### stakerAddress

`string`

Address of the staker

#### Returns

`Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)\>

Staker info from subgraph

***

### getStakers()

> `static` **getStakers**(`filter`): `Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)[]\>

Defined in: [staking.ts:530](https://github.com/humanprotocol/human-protocol/blob/8551ddf36370251a82fddadc0d28c34592acebaf/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L530)

Gets all stakers from the subgraph with filters, pagination and ordering.

#### Parameters

##### filter

[`IStakersFilter`](../../interfaces/interfaces/IStakersFilter.md)

#### Returns

`Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)[]\>

Array of stakers
