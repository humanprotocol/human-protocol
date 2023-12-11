[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [staking](../modules/staking.md) / StakingClient

# Class: StakingClient

[staking](../modules/staking.md).StakingClient

## Introduction

This client enables to perform actions on staking contracts and obtain staking information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the `signerOrProvider`.
To use this client, it is recommended to initialize it using the static `build` method.

```ts
static async build(signerOrProvider: Signer | Provider);
```

A `Signer` or a `Provider` should be passed depending on the use case of this module:

- **Signer**: when the user wants to use this model in order to send transactions caling the contract functions.
- **Provider**: when the user wants to use this model in order to get information from the contracts or subgraph.

## Installation

### npm
```bash
npm install @human-protocol/sdk
```

### yarn
```bash
yarn install @human-protocol/sdk
```

## Code example

### Signer

**Using private key(backend)**

```ts
import { StakingClient } from '@human-protocol/sdk';
import { Wallet, providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);
```

**Using Wagmi(frontend)**

```ts
import { useSigner, useChainId } from 'wagmi';
import { StakingClient } from '@human-protocol/sdk';

const { data: signer } = useSigner();
const stakingClient = await StakingClient.build(signer);
```

### Provider

```ts
import { StakingClient } from '@human-protocol/sdk';
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const stakingClient = await StakingClient.build(provider);
```

## Hierarchy

- [`BaseEthersClient`](base.BaseEthersClient.md)

  ↳ **`StakingClient`**

## Table of contents

### Constructors

- [constructor](staking.StakingClient.md#constructor)

### Properties

- [escrowFactoryContract](staking.StakingClient.md#escrowfactorycontract)
- [gasPriceMultiplier](staking.StakingClient.md#gaspricemultiplier)
- [networkData](staking.StakingClient.md#networkdata)
- [rewardPoolContract](staking.StakingClient.md#rewardpoolcontract)
- [signerOrProvider](staking.StakingClient.md#signerorprovider)
- [stakingContract](staking.StakingClient.md#stakingcontract)
- [tokenContract](staking.StakingClient.md#tokencontract)

### Methods

- [allocate](staking.StakingClient.md#allocate)
- [approveStake](staking.StakingClient.md#approvestake)
- [checkValidEscrow](staking.StakingClient.md#checkvalidescrow)
- [closeAllocation](staking.StakingClient.md#closeallocation)
- [distributeReward](staking.StakingClient.md#distributereward)
- [gasPriceOptions](staking.StakingClient.md#gaspriceoptions)
- [getAllocation](staking.StakingClient.md#getallocation)
- [getLeader](staking.StakingClient.md#getleader)
- [getLeaders](staking.StakingClient.md#getleaders)
- [getRewards](staking.StakingClient.md#getrewards)
- [slash](staking.StakingClient.md#slash)
- [stake](staking.StakingClient.md#stake)
- [unstake](staking.StakingClient.md#unstake)
- [withdraw](staking.StakingClient.md#withdraw)
- [build](staking.StakingClient.md#build)

## Constructors

### constructor

• **new StakingClient**(`signerOrProvider`, `networkData`, `gasPriceMultiplier?`)

**StakingClient constructor**

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signerOrProvider` | `Signer` \| `Provider` | The Signer or Provider object to interact with the Ethereum network |
| `networkData` | `NetworkData` | - |
| `gasPriceMultiplier?` | `number` | The multiplier to apply to the gas price |

#### Overrides

[BaseEthersClient](base.BaseEthersClient.md).[constructor](base.BaseEthersClient.md#constructor)

#### Defined in

[staking.ts:119](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L119)

## Properties

### escrowFactoryContract

• **escrowFactoryContract**: `EscrowFactory`

#### Defined in

[staking.ts:109](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L109)

___

### gasPriceMultiplier

• `Protected` `Optional` **gasPriceMultiplier**: `number`

#### Inherited from

[BaseEthersClient](base.BaseEthersClient.md).[gasPriceMultiplier](base.BaseEthersClient.md#gaspricemultiplier)

#### Defined in

[base.ts:14](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L14)

___

### networkData

• **networkData**: `NetworkData`

#### Inherited from

[BaseEthersClient](base.BaseEthersClient.md).[networkData](base.BaseEthersClient.md#networkdata)

#### Defined in

[base.ts:15](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L15)

___

### rewardPoolContract

• **rewardPoolContract**: `RewardPool`

#### Defined in

[staking.ts:110](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L110)

___

### signerOrProvider

• `Protected` **signerOrProvider**: `Signer` \| `Provider`

#### Inherited from

[BaseEthersClient](base.BaseEthersClient.md).[signerOrProvider](base.BaseEthersClient.md#signerorprovider)

#### Defined in

[base.ts:13](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L13)

___

### stakingContract

• **stakingContract**: `Staking`

#### Defined in

[staking.ts:108](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L108)

___

### tokenContract

• **tokenContract**: `HMToken`

#### Defined in

[staking.ts:107](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L107)

## Methods

### allocate

▸ **allocate**(`escrowAddress`, `amount`): `Promise`<`void`\>

This function allocates a portion of the staked tokens to a specific escrow.

> Must have tokens staked

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `escrowAddress` | `string` | Address of the escrow contract to allocate in. |
| `amount` | `BigNumber` | Amount in WEI of tokens to allocate. |

#### Returns

`Promise`<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { ethers, Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

const amount = ethers.utils.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.allocate('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
```

#### Defined in

[staking.ts:461](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L461)

___

### approveStake

▸ **approveStake**(`amount`): `Promise`<`void`\>

This function approves the staking contract to transfer a specified amount of tokens when the user stakes. It increases the allowance for the staking contract.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `BigNumber` | Amount in WEI of tokens to approve for stake. |

#### Returns

`Promise`<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { ethers, Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

const amount = ethers.utils.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.approveStake(amount);
```

#### Defined in

[staking.ts:222](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L222)

___

### checkValidEscrow

▸ `Private` **checkValidEscrow**(`escrowAddress`): `Promise`<`void`\>

Check if escrow exists

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `escrowAddress` | `string` | Escrow address to check against |

#### Returns

`Promise`<`void`\>

#### Defined in

[staking.ts:187](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L187)

___

### closeAllocation

▸ **closeAllocation**(`escrowAddress`): `Promise`<`void`\>

This function drops the allocation from a specific escrow.

> The escrow must have allocation
> The escrow must be cancelled or completed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `escrowAddress` | `string` | Address of the escrow contract to close allocation from. |

#### Returns

`Promise`<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

await stakingClient.closeAllocation('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

[staking.ts:512](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L512)

___

### distributeReward

▸ **distributeReward**(`escrowAddress`): `Promise`<`void`\>

This function drops the allocation from a specific escrow.

> The escrow must have rewards added

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `escrowAddress` | `string` | Escrow address from which rewards are distributed. |

#### Returns

`Promise`<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

await stakingClient.distributeReward('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

[staking.ts:551](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L551)

___

### gasPriceOptions

▸ `Protected` **gasPriceOptions**(): `Promise`<`Partial`<`Overrides`\>\>

Adjust the gas price, and return as an option to be passed to a transaction

#### Returns

`Promise`<`Partial`<`Overrides`\>\>

Returns the gas price options

#### Inherited from

[BaseEthersClient](base.BaseEthersClient.md).[gasPriceOptions](base.BaseEthersClient.md#gaspriceoptions)

#### Defined in

[base.ts:39](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L39)

___

### getAllocation

▸ **getAllocation**(`escrowAddress`): `Promise`<`IAllocation`\>

This function returns information about the allocation of the specified escrow.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `escrowAddress` | `string` | Escrow address from which we want to get allocation information. |

#### Returns

`Promise`<`IAllocation`\>

Returns allocation info if exists.

**Code example**

```ts
import { StakingClient } from '@human-protocol/sdk';
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const stakingClient = await StakingClient.build(provider);

const allocationInfo = await stakingClient.getAllocation('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

[staking.ts:659](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L659)

___

### getLeader

▸ **getLeader**(`address`): `Promise`<`ILeader`\>

This function returns all the leader details of the protocol.

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

`Promise`<`ILeader`\>

Returns an array with all the leader details.

**Code example**

```ts
import { StakingClient } from '@human-protocol/sdk';
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const stakingClient = await StakingClient.build(provider);

const leaders = await stakingClient.getLeaders();
```

#### Defined in

[staking.ts:585](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L585)

___

### getLeaders

▸ **getLeaders**(`filter?`): `Promise`<`ILeader`[]\>

This function returns the leader data for the given address.

#### Parameters

| Name | Type |
| :------ | :------ |
| `filter` | `ILeadersFilter` |

#### Returns

`Promise`<`ILeader`[]\>

Returns the leader details.

**Code example**

```ts
import { StakingClient } from '@human-protocol/sdk';
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const stakingClient = await StakingClient.build(provider);

const leader = await stakingClient.getLeader('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

[staking.ts:624](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L624)

___

### getRewards

▸ **getRewards**(`slasherAddress`): `Promise`<`IReward`[]\>

This function returns information about the rewards for a given slasher address.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `slasherAddress` | `string` | Slasher address. |

#### Returns

`Promise`<`IReward`[]\>

Returns an array of Reward objects that contain the rewards earned by the user through slashing other users.

**Code example**

```ts
import { StakingClient } from '@human-protocol/sdk';
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const stakingClient = await StakingClient.build(provider);

const rewards = await stakingClient.getRewards('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Defined in

[staking.ts:691](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L691)

___

### slash

▸ **slash**(`slasher`, `staker`, `escrowAddress`, `amount`): `Promise`<`void`\>

This function reduces the allocated amount by an staker in an escrow and transfers those tokens to the reward pool. This allows the slasher to claim them later.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `slasher` | `string` | Wallet address from who requested the slash |
| `staker` | `string` | Wallet address from who is going to be slashed |
| `escrowAddress` | `string` | Address of the escrow which allocation will be slashed |
| `amount` | `BigNumber` | Amount in WEI of tokens to unstake. |

#### Returns

`Promise`<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { ethers, Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

const amount = ethers.utils.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.slash('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
```

#### Defined in

[staking.ts:398](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L398)

___

### stake

▸ **stake**(`amount`): `Promise`<`void`\>

This function stakes a specified amount of tokens on a specific network.

> `approveStake` must be called before

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `BigNumber` | Amount in WEI of tokens to stake. |

#### Returns

`Promise`<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { ethers, Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

const amount = ethers.utils.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.approveStake(amount); // if it was already approved before, this is not necessary
await stakingClient.approveStake(amount);
```

#### Defined in

[staking.ts:269](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L269)

___

### unstake

▸ **unstake**(`amount`): `Promise`<`void`\>

This function unstakes tokens from staking contract. The unstaked tokens stay locked for a period of time.

> Must have tokens available to unstake

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `BigNumber` | Amount in WEI of tokens to unstake. |

#### Returns

`Promise`<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { ethers, Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

const amount = ethers.utils.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.unstake(amount);
```

#### Defined in

[staking.ts:315](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L315)

___

### withdraw

▸ **withdraw**(): `Promise`<`void`\>

This function withdraws unstaked and non locked tokens form staking contract to the user wallet.

> Must have tokens available to withdraw

#### Returns

`Promise`<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

await stakingClient.withdraw();
```

#### Defined in

[staking.ts:359](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L359)

___

### build

▸ `Static` **build**(`signerOrProvider`, `gasPriceMultiplier?`): `Promise`<[`StakingClient`](staking.StakingClient.md)\>

Creates an instance of StakingClient from a Signer or Provider.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signerOrProvider` | `Signer` \| `Provider` | The Signer or Provider object to interact with the Ethereum network |
| `gasPriceMultiplier?` | `number` | The multiplier to apply to the gas price |

#### Returns

`Promise`<[`StakingClient`](staking.StakingClient.md)\>

- An instance of StakingClient

**`Throws`**

- Thrown if the provider does not exist for the provided Signer

**`Throws`**

- Thrown if the network's chainId is not supported

#### Defined in

[staking.ts:157](https://github.com/humanprotocol/human-protocol/blob/fe3befbd/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L157)
