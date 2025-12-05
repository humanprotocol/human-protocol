Utility class for Staking-related subgraph queries.

## Example

```ts
import { StakingUtils, ChainId } from '@human-protocol/sdk';

const staker = await StakingUtils.getStaker(
  ChainId.POLYGON_AMOY,
  '0xYourStakerAddress'
);
console.log('Staked amount:', staker.stakedAmount);
```

## Methods

### getStaker()

```ts
static getStaker(
   chainId: ChainId, 
   stakerAddress: string, 
options?: SubgraphOptions): Promise<IStaker>;
```

Gets staking info for a staker from the subgraph.

#### Throws

ErrorInvalidStakerAddressProvided If the staker address is invalid

#### Throws

ErrorUnsupportedChainID If the chain ID is not supported

#### Throws

ErrorStakerNotFound If the staker is not found

#### Example

```ts
import { StakingUtils, ChainId } from '@human-protocol/sdk';

const staker = await StakingUtils.getStaker(
  ChainId.POLYGON_AMOY,
  '0xYourStakerAddress'
);
console.log('Staked amount:', staker.stakedAmount);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the staking contract is deployed |
| `stakerAddress` | `string` | Address of the staker |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`IStaker`\>

Staker info from subgraph

***

### getStakers()

```ts
static getStakers(filter: IStakersFilter, options?: SubgraphOptions): Promise<IStaker[]>;
```

Gets all stakers from the subgraph with filters, pagination and ordering.

#### Throws

ErrorUnsupportedChainID If the chain ID is not supported

#### Example

```ts
import { ChainId } from '@human-protocol/sdk';

const filter = {
  chainId: ChainId.POLYGON_AMOY,
  minStakedAmount: '1000000000000000000', // 1 token in WEI
};
const stakers = await StakingUtils.getStakers(filter);
console.log('Stakers:', stakers.length);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filter` | `IStakersFilter` | Stakers filter with pagination and ordering |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`IStaker`[]\>

Array of stakers
