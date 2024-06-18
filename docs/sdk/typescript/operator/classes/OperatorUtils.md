[**@human-protocol/sdk**](../../README.md) • **Docs**

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

> `static` **getLeader**(`chainId`, `address`): `Promise`\<`ILeader`\>

This function returns the leader data for the given address.

#### Parameters

• **chainId**: `ChainId`

• **address**: `string`

Leader address.

#### Returns

`Promise`\<`ILeader`\>

Returns the leader details.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const leader = await OperatorUtils.getLeader(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Source

[operator.ts:44](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L44)

***

### getLeaders()

> `static` **getLeaders**(`filter`): `Promise`\<`ILeader`[]\>

This function returns all the leader details of the protocol.

#### Parameters

• **filter**: `ILeadersFilter`

Filter for the leaders.

#### Returns

`Promise`\<`ILeader`[]\>

Returns an array with all the leader details.

**Code example**

```ts
import { OperatorUtils } from '@human-protocol/sdk';

const filter: ILeadersFilter = {
 chainId: ChainId.POLYGON
};
const leaders = await OperatorUtils.getLeaders(filter);
```

#### Source

[operator.ts:99](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L99)

***

### getReputationNetworkOperators()

> `static` **getReputationNetworkOperators**(`chainId`, `address`, `role`?): `Promise`\<`IOperator`[]\>

Retrieves the reputation network operators of the specified address.

#### Parameters

• **chainId**: `ChainId`

• **address**: `string`

Address of the reputation oracle.

• **role?**: `string`

(Optional) Role of the operator.

#### Returns

`Promise`\<`IOperator`[]\>

- Returns an array of operator details.

#### Example

```typescript
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const operators = await OperatorUtils.getReputationNetworkOperators(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Source

[operator.ts:155](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L155)

***

### getRewards()

> `static` **getRewards**(`chainId`, `slasherAddress`): `Promise`\<`IReward`[]\>

This function returns information about the rewards for a given slasher address.

#### Parameters

• **chainId**: `ChainId`

• **slasherAddress**: `string`

Slasher address.

#### Returns

`Promise`\<`IReward`[]\>

Returns an array of Reward objects that contain the rewards earned by the user through slashing other users.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const rewards = await OperatorUtils.getRewards(ChainId.POLYGON_AMOY, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Source

[operator.ts:207](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L207)
