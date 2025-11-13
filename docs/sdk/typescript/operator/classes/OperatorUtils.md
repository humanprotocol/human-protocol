[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [operator](../README.md) / OperatorUtils

# Class: OperatorUtils

Defined in: [operator.ts:29](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L29)

## Constructors

### Constructor

> **new OperatorUtils**(): `OperatorUtils`

#### Returns

`OperatorUtils`

## Methods

### getOperator()

> `static` **getOperator**(`chainId`, `address`, `options?`): `Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md) \| `null`\>

Defined in: [operator.ts:46](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L46)

This function returns the operator data for the given address.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the operator is deployed

##### address

`string`

Operator address.

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md) \| `null`\>

- Returns the operator details or null if not found.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const operator = await OperatorUtils.getOperator(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getOperators()

> `static` **getOperators**(`filter`, `options?`): `Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md)[]\>

Defined in: [operator.ts:92](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L92)

This function returns all the operator details of the protocol.

#### Parameters

##### filter

[`IOperatorsFilter`](../../interfaces/interfaces/IOperatorsFilter.md)

Filter for the operators.

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md)[]\>

Returns an array with all the operator details.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const filter: IOperatorsFilter = {
 chainId: ChainId.POLYGON
};
const operators = await OperatorUtils.getOperators(filter);
```

***

### getReputationNetworkOperators()

> `static` **getReputationNetworkOperators**(`chainId`, `address`, `role?`, `options?`): `Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md)[]\>

Defined in: [operator.ts:159](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L159)

Retrieves the reputation network operators of the specified address.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the reputation network is deployed

##### address

`string`

Address of the reputation oracle.

##### role?

`string`

(Optional) Role of the operator.

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md)[]\>

- Returns an array of operator details.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const operators = await OperatorUtils.getReputationNetworkOperators(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getRewards()

> `static` **getRewards**(`chainId`, `slasherAddress`, `options?`): `Promise`\<[`IReward`](../../interfaces/interfaces/IReward.md)[]\>

Defined in: [operator.ts:205](https://github.com/humanprotocol/human-protocol/blob/faeb610cb2eb1159ae2a32eb5ba27f30a6f24913/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L205)

This function returns information about the rewards for a given slasher address.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the rewards are deployed

##### slasherAddress

`string`

Slasher address.

##### options?

[`SubgraphOptions`](../../interfaces/interfaces/SubgraphOptions.md)

Optional configuration for subgraph requests.

#### Returns

`Promise`\<[`IReward`](../../interfaces/interfaces/IReward.md)[]\>

Returns an array of Reward objects that contain the rewards earned by the user through slashing other users.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const rewards = await OperatorUtils.getRewards(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```
