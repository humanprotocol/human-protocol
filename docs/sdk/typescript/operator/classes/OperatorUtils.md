[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [operator](../README.md) / OperatorUtils

# Class: OperatorUtils

## Constructors

### new OperatorUtils()

> **new OperatorUtils**(): [`OperatorUtils`](OperatorUtils.md)

#### Returns

[`OperatorUtils`](OperatorUtils.md)

## Methods

### getOperator()

> `static` **getOperator**(`chainId`, `address`): `Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md)\>

This function returns the operator data for the given address.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the operator is deployed

##### address

`string`

Operator address.

#### Returns

`Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md)\>

Returns the operator details.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const operator = await OperatorUtils.getOperator(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

<<<<<<< HEAD
[operator.ts:43](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L43)
=======
[operator.ts:44](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L44)
>>>>>>> develop

***

### getOperators()

> `static` **getOperators**(`filter`): `Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md)[]\>

This function returns all the operator details of the protocol.

#### Parameters

##### filter

[`IOperatorsFilter`](../../interfaces/interfaces/IOperatorsFilter.md)

Filter for the operators.

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

#### Defined in

<<<<<<< HEAD
[operator.ts:109](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L109)
=======
[operator.ts:107](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L107)
>>>>>>> develop

***

### getReputationNetworkOperators()

> `static` **getReputationNetworkOperators**(`chainId`, `address`, `role`?): `Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md)[]\>

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

#### Returns

`Promise`\<[`IOperator`](../../interfaces/interfaces/IOperator.md)[]\>

- Returns an array of operator details.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const operators = await OperatorUtils.getReputationNetworkOperators(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

<<<<<<< HEAD
[operator.ts:190](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L190)
=======
[operator.ts:186](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L186)
>>>>>>> develop

***

### getRewards()

> `static` **getRewards**(`chainId`, `slasherAddress`): `Promise`\<[`IReward`](../../interfaces/interfaces/IReward.md)[]\>

This function returns information about the rewards for a given slasher address.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the rewards are deployed

##### slasherAddress

`string`

Slasher address.

#### Returns

`Promise`\<[`IReward`](../../interfaces/interfaces/IReward.md)[]\>

Returns an array of Reward objects that contain the rewards earned by the user through slashing other users.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const rewards = await OperatorUtils.getRewards(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

<<<<<<< HEAD
[operator.ts:244](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L244)
=======
[operator.ts:236](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L236)
>>>>>>> develop
