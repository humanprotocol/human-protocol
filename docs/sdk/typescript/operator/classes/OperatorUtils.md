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

### getLeader()

> `static` **getLeader**(`chainId`, `address`): `Promise`\<[`ILeader`](../../interfaces/interfaces/ILeader.md)\>

This function returns the leader data for the given address.

#### Parameters

##### chainId

[`ChainId`](../../enums/enumerations/ChainId.md)

Network in which the leader is deployed

##### address

`string`

Leader address.

#### Returns

`Promise`\<[`ILeader`](../../interfaces/interfaces/ILeader.md)\>

Returns the leader details.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const leader = await OperatorUtils.getLeader(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

<<<<<<< HEAD
[operator.ts:44](https://github.com/humanprotocol/human-protocol/blob/3ed5fd393b562534f83a6f2f110eb4e3977deb72/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L44)
=======
[operator.ts:44](https://github.com/humanprotocol/human-protocol/blob/b190dc1831c2c96fe3d44fd63e915e54011e1ec8/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L44)
>>>>>>> develop

***

### getLeaders()

> `static` **getLeaders**(`filter`): `Promise`\<[`ILeader`](../../interfaces/interfaces/ILeader.md)[]\>

This function returns all the leader details of the protocol.

#### Parameters

##### filter

[`ILeadersFilter`](../../interfaces/interfaces/ILeadersFilter.md)

Filter for the leaders.

#### Returns

`Promise`\<[`ILeader`](../../interfaces/interfaces/ILeader.md)[]\>

Returns an array with all the leader details.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const filter: ILeadersFilter = {
 chainId: ChainId.POLYGON
};
const leaders = await OperatorUtils.getLeaders(filter);
```

#### Defined in

<<<<<<< HEAD
[operator.ts:108](https://github.com/humanprotocol/human-protocol/blob/3ed5fd393b562534f83a6f2f110eb4e3977deb72/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L108)
=======
[operator.ts:107](https://github.com/humanprotocol/human-protocol/blob/b190dc1831c2c96fe3d44fd63e915e54011e1ec8/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L107)
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
[operator.ts:185](https://github.com/humanprotocol/human-protocol/blob/3ed5fd393b562534f83a6f2f110eb4e3977deb72/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L185)
=======
[operator.ts:186](https://github.com/humanprotocol/human-protocol/blob/b190dc1831c2c96fe3d44fd63e915e54011e1ec8/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L186)
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
[operator.ts:235](https://github.com/humanprotocol/human-protocol/blob/3ed5fd393b562534f83a6f2f110eb4e3977deb72/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L235)
=======
[operator.ts:236](https://github.com/humanprotocol/human-protocol/blob/b190dc1831c2c96fe3d44fd63e915e54011e1ec8/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L236)
>>>>>>> develop
