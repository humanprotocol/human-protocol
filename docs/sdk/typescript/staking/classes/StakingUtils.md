[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [staking](../README.md) / StakingUtils

# Class: StakingUtils

Defined in: [staking.ts:496](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L496)

Utility class for Staking-related subgraph queries.

## Constructors

### Constructor

> **new StakingUtils**(): `StakingUtils`

#### Returns

`StakingUtils`

## Methods

### getStaker()

> `static` **getStaker**(`chainId`, `stakerAddress`, `options?`): `Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)\>

Defined in: [staking.ts:505](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L505)

Gets staking info for a staker from the subgraph.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the staking contract is deployed

##### stakerAddress

`string`

Address of the staker

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)\>

Staker info from subgraph

***

### getStakers()

> `static` **getStakers**(`filter`, `options?`): `Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)[]\>

Defined in: [staking.ts:540](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L540)

Gets all stakers from the subgraph with filters, pagination and ordering.

#### Parameters

##### filter

[`IStakersFilter`](../../interfaces/interfaces/IStakersFilter.md)

Stakers filter with pagination and ordering

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IStaker`](../../interfaces/interfaces/IStaker.md)[]\>

Array of stakers
