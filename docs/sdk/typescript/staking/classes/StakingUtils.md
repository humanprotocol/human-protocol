[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [staking](../README.md) / StakingUtils

# Class: StakingUtils

Defined in: [staking.ts:479](https://github.com/humanprotocol/human-protocol/blob/4dad01e5a92c46a45d83aec7fcaea2d2e541271c/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L479)

Utility class for Staking-related subgraph queries.

## Constructors

### Constructor

> **new StakingUtils**(): `StakingUtils`

#### Returns

`StakingUtils`

## Methods

### getStaker()

> `static` **getStaker**(`chainId`, `stakerAddress`): `Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)\>

Defined in: [staking.ts:487](https://github.com/humanprotocol/human-protocol/blob/4dad01e5a92c46a45d83aec7fcaea2d2e541271c/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L487)

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

Defined in: [staking.ts:518](https://github.com/humanprotocol/human-protocol/blob/4dad01e5a92c46a45d83aec7fcaea2d2e541271c/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L518)

Gets all stakers from the subgraph with filters, pagination and ordering.

#### Parameters

##### filter

[`IStakersFilter`](../../interfaces/interfaces/IStakersFilter.md)

#### Returns

`Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)[]\>

Array of stakers
