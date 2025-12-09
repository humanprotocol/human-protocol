Utility helpers for operator-related queries.

## Example

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const operator = await OperatorUtils.getOperator(
  ChainId.POLYGON_AMOY,
  '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
);
console.log('Operator:', operator);
```

## Methods

### getOperator()

```ts
static getOperator(
   chainId: ChainId, 
   address: string, 
options?: SubgraphOptions): Promise<IOperator | null>;
```

This function returns the operator data for the given address.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the operator is deployed |
| `address` | `string` | Operator address. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IOperator \| null` | Returns the operator details or null if not found. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidStakerAddressProvided` | If the address is invalid |
| `ErrorUnsupportedChainID` | If the chain ID is not supported |

???+ example "Example"

    ```ts
    import { OperatorUtils, ChainId } from '@human-protocol/sdk';
    
    const operator = await OperatorUtils.getOperator(
      ChainId.POLYGON_AMOY,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
    );
    console.log('Operator:', operator);
    ```


***

### getOperators()

```ts
static getOperators(filter: IOperatorsFilter, options?: SubgraphOptions): Promise<IOperator[]>;
```

This function returns all the operator details of the protocol.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filter` | `IOperatorsFilter` | Filter for the operators. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IOperator[]` | Returns an array with all the operator details. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorUnsupportedChainID` | If the chain ID is not supported |

???+ example "Example"

    ```ts
    import { ChainId } from '@human-protocol/sdk';
    
    const filter = {
      chainId: ChainId.POLYGON_AMOY
    };
    const operators = await OperatorUtils.getOperators(filter);
    console.log('Operators:', operators.length);
    ```


***

### getReputationNetworkOperators()

```ts
static getReputationNetworkOperators(
   chainId: ChainId, 
   address: string, 
   role?: string, 
options?: SubgraphOptions): Promise<IOperator[]>;
```

Retrieves the reputation network operators of the specified address.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the reputation network is deployed |
| `address` | `string` | Address of the reputation oracle. |
| `role?` | `string` | Role of the operator (optional). |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IOperator[]` | Returns an array of operator details. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorUnsupportedChainID` | If the chain ID is not supported |

???+ example "Example"

    ```ts
    import { OperatorUtils, ChainId } from '@human-protocol/sdk';
    
    const operators = await OperatorUtils.getReputationNetworkOperators(
      ChainId.POLYGON_AMOY,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
    );
    console.log('Operators:', operators.length);
    ```


***

### getRewards()

```ts
static getRewards(
   chainId: ChainId, 
   slasherAddress: string, 
options?: SubgraphOptions): Promise<IReward[]>;
```

This function returns information about the rewards for a given slasher address.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the rewards are deployed |
| `slasherAddress` | `string` | Slasher address. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |


#### Returns

| Type | Description |
|------|-------------|
| `IReward[]` | Returns an array of Reward objects that contain the rewards earned by the user through slashing other users. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidSlasherAddressProvided` | If the slasher address is invalid |
| `ErrorUnsupportedChainID` | If the chain ID is not supported |

???+ example "Example"

    ```ts
    import { OperatorUtils, ChainId } from '@human-protocol/sdk';
    
    const rewards = await OperatorUtils.getRewards(
      ChainId.POLYGON_AMOY,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
    );
    console.log('Rewards:', rewards.length);
    ```

