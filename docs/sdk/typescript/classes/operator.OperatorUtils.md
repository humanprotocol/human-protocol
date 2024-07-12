[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [operator](../modules/operator.md) / OperatorUtils

# Class: OperatorUtils

[operator](../modules/operator.md).OperatorUtils

## Table of contents

### Constructors

- [constructor](operator.OperatorUtils.md#constructor)

### Methods

- [getLeader](operator.OperatorUtils.md#getleader)
- [getLeaders](operator.OperatorUtils.md#getleaders)
- [getReputationNetworkOperators](operator.OperatorUtils.md#getreputationnetworkoperators)
- [getRewards](operator.OperatorUtils.md#getrewards)

## Constructors

### constructor

• **new OperatorUtils**(): [`OperatorUtils`](operator.OperatorUtils.md)

#### Returns

[`OperatorUtils`](operator.OperatorUtils.md)

## Methods

### getLeader

▸ **getLeader**(`chainId`, `address`): `Promise`\<`ILeader`\>

This function returns the leader data for the given address.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `ChainId` | - |
| `address` | `string` | Leader address. |

#### Returns

`Promise`\<`ILeader`\>

Returns the leader details.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const leader = await OperatorUtils.getLeader(ChainId.POLYGON_MUMBAI, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

[operator.ts:43](https://github.com/humanprotocol/human-protocol/blob/48066071/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L43)

___

### getLeaders

▸ **getLeaders**(`filter?`): `Promise`\<`ILeader`[]\>

This function returns all the leader details of the protocol.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `filter` | `ILeadersFilter` | Filter for the leaders. |

#### Returns

`Promise`\<`ILeader`[]\>

Returns an array with all the leader details.

**Code example**

```ts
import { OperatorUtils } from '@human-protocol/sdk';

const leaders = await OperatorUtils.getLeaders();
```

#### Defined in

[operator.ts:84](https://github.com/humanprotocol/human-protocol/blob/48066071/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L84)

___

### getReputationNetworkOperators

▸ **getReputationNetworkOperators**(`chainId`, `address`, `role?`): `Promise`\<`IOperator`[]\>

Retrieves the reputation network operators of the specified address.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `ChainId` | - |
| `address` | `string` | Address of the reputation oracle. |
| `role?` | `string` | (Optional) Role of the operator. |

#### Returns

`Promise`\<`IOperator`[]\>

- Returns an array of operator details.

**`Example`**

```typescript
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const operators = await OperatorUtils.getReputationNetworkOperators(ChainId.POLYGON_MUMBAI, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

[operator.ts:123](https://github.com/humanprotocol/human-protocol/blob/48066071/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L123)

___

### getRewards

▸ **getRewards**(`chainId`, `slasherAddress`): `Promise`\<`IReward`[]\>

This function returns information about the rewards for a given slasher address.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `ChainId` | - |
| `slasherAddress` | `string` | Slasher address. |

#### Returns

`Promise`\<`IReward`[]\>

Returns an array of Reward objects that contain the rewards earned by the user through slashing other users.

**Code example**

```ts
import { OperatorUtils, ChainId } from '@human-protocol/sdk';

const rewards = await OperatorUtils.getRewards(ChainId.POLYGON_MUMBAI, '0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

[operator.ts:162](https://github.com/humanprotocol/human-protocol/blob/48066071/packages/sdk/typescript/human-protocol-sdk/src/operator.ts#L162)
