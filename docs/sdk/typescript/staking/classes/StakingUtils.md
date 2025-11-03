[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [staking](../README.md) / StakingUtils

# Class: StakingUtils

Defined in: [staking.ts:492](https://github.com/humanprotocol/human-protocol/blob/d055cfd598260e2e29b8b12885f1ee350eef64a4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L492)

Utility class for Staking-related subgraph queries.

## Constructors

### Constructor

> **new StakingUtils**(): `StakingUtils`

#### Returns

`StakingUtils`

## Methods

### getStaker()

> `static` **getStaker**(`chainId`, `stakerAddress`): `Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)\>

Defined in: [staking.ts:500](https://github.com/humanprotocol/human-protocol/blob/d055cfd598260e2e29b8b12885f1ee350eef64a4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L500)

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

Defined in: [staking.ts:531](https://github.com/humanprotocol/human-protocol/blob/d055cfd598260e2e29b8b12885f1ee350eef64a4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L531)

Gets all stakers from the subgraph with filters, pagination and ordering.

#### Parameters

##### filter

[`IStakersFilter`](../../interfaces/interfaces/IStakersFilter.md)

#### Returns

`Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)[]\>

Array of stakers
