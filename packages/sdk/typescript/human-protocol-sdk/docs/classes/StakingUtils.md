Utility helpers for Staking-related queries.

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

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the staking contract is deployed |
| `stakerAddress` | `string` | Address of the staker |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IStaker` | Staker info from subgraph |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidStakerAddressProvided` | If the staker address is invalid |
| `ErrorUnsupportedChainID` | If the chain ID is not supported |
| `ErrorStakerNotFound` | If the staker is not found |

???+ example "Example"

    ```ts
    import { StakingUtils, ChainId } from '@human-protocol/sdk';
    
    const staker = await StakingUtils.getStaker(
      ChainId.POLYGON_AMOY,
      '0xYourStakerAddress'
    );
    console.log('Staked amount:', staker.stakedAmount);
    ```


***

### getStakers()

```ts
static getStakers(filter: IStakersFilter, options?: SubgraphOptions): Promise<IStaker[]>;
```

Gets all stakers from the subgraph with filters, pagination and ordering.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filter` | `IStakersFilter` | Stakers filter with pagination and ordering |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IStaker[]` | Array of stakers |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorUnsupportedChainID` | If the chain ID is not supported |

???+ example "Example"

    ```ts
    import { ChainId } from '@human-protocol/sdk';
    
    const filter = {
      chainId: ChainId.POLYGON_AMOY,
      minStakedAmount: '1000000000000000000', // 1 token in WEI
    };
    const stakers = await StakingUtils.getStakers(filter);
    console.log('Stakers:', stakers.length);
    ```

