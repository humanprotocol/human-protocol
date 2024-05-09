[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [staking](../modules/staking.md) / StakingClient

# Class: StakingClient

[staking](../modules/staking.md).StakingClient

## Introduction

This client enables to perform actions on staking contracts and obtain staking information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the `runner`.
To use this client, it is recommended to initialize it using the static `build` method.

```ts
static async build(runner: ContractRunner);
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
- [networkData](staking.StakingClient.md#networkdata)
- [rewardPoolContract](staking.StakingClient.md#rewardpoolcontract)
- [runner](staking.StakingClient.md#runner)
- [stakingContract](staking.StakingClient.md#stakingcontract)
- [tokenContract](staking.StakingClient.md#tokencontract)

### Methods

- [allocate](staking.StakingClient.md#allocate)
- [approveStake](staking.StakingClient.md#approvestake)
- [checkValidEscrow](staking.StakingClient.md#checkvalidescrow)
- [closeAllocation](staking.StakingClient.md#closeallocation)
- [distributeReward](staking.StakingClient.md#distributereward)
- [getAllocation](staking.StakingClient.md#getallocation)
- [slash](staking.StakingClient.md#slash)
- [stake](staking.StakingClient.md#stake)
- [unstake](staking.StakingClient.md#unstake)
- [withdraw](staking.StakingClient.md#withdraw)
- [build](staking.StakingClient.md#build)

## Constructors

### constructor

• **new StakingClient**(`runner`, `networkData`): [`StakingClient`](staking.StakingClient.md)

**StakingClient constructor**

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |
| `networkData` | `NetworkData` | - |

#### Returns

[`StakingClient`](staking.StakingClient.md)

#### Overrides

[BaseEthersClient](base.BaseEthersClient.md).[constructor](base.BaseEthersClient.md#constructor)

#### Defined in

[staking.ts:111](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L111)

## Properties

### escrowFactoryContract

• **escrowFactoryContract**: `EscrowFactory`

#### Defined in

[staking.ts:102](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L102)

___

### networkData

• **networkData**: `NetworkData`

#### Inherited from

[BaseEthersClient](base.BaseEthersClient.md).[networkData](base.BaseEthersClient.md#networkdata)

#### Defined in

[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)

___

### rewardPoolContract

• **rewardPoolContract**: `RewardPool`

#### Defined in

[staking.ts:103](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L103)

___

### runner

• `Protected` **runner**: `ContractRunner`

#### Inherited from

[BaseEthersClient](base.BaseEthersClient.md).[runner](base.BaseEthersClient.md#runner)

#### Defined in

[base.ts:11](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)

___

### stakingContract

• **stakingContract**: `Staking`

#### Defined in

[staking.ts:101](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L101)

___

### tokenContract

• **tokenContract**: `HMToken`

#### Defined in

[staking.ts:100](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L100)

## Methods

### allocate

▸ **allocate**(`escrowAddress`, `amount`, `txOptions?`): `Promise`\<`void`\>

This function allocates a portion of the staked tokens to a specific escrow.

> Must have tokens staked

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `escrowAddress` | `string` | Address of the escrow contract to allocate in. |
| `amount` | `bigint` | Amount in WEI of tokens to allocate. |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

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

const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.allocate('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
```

#### Defined in

[staking.ts:458](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L458)

___

### approveStake

▸ **approveStake**(`amount`, `txOptions?`): `Promise`\<`void`\>

This function approves the staking contract to transfer a specified amount of tokens when the user stakes. It increases the allowance for the staking contract.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `bigint` | Amount in WEI of tokens to approve for stake. |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

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

const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.approveStake(amount);
```

#### Defined in

[staking.ts:203](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L203)

___

### checkValidEscrow

▸ **checkValidEscrow**(`escrowAddress`): `Promise`\<`void`\>

Check if escrow exists

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `escrowAddress` | `string` | Escrow address to check against |

#### Returns

`Promise`\<`void`\>

#### Defined in

[staking.ts:167](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L167)

___

### closeAllocation

▸ **closeAllocation**(`escrowAddress`, `txOptions?`): `Promise`\<`void`\>

This function drops the allocation from a specific escrow.

> The escrow must have allocation
> The escrow must be cancelled or completed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `escrowAddress` | `string` | Address of the escrow contract to close allocation from. |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

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

[staking.ts:511](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L511)

___

### distributeReward

▸ **distributeReward**(`escrowAddress`, `txOptions?`): `Promise`\<`void`\>

This function drops the allocation from a specific escrow.

> The escrow must have rewards added

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `escrowAddress` | `string` | Escrow address from which rewards are distributed. |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

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

[staking.ts:554](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L554)

___

### getAllocation

▸ **getAllocation**(`escrowAddress`): `Promise`\<`IAllocation`\>

This function returns information about the allocation of the specified escrow.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `escrowAddress` | `string` | Escrow address from which we want to get allocation information. |

#### Returns

`Promise`\<`IAllocation`\>

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

[staking.ts:591](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L591)

___

### slash

▸ **slash**(`slasher`, `staker`, `escrowAddress`, `amount`, `txOptions?`): `Promise`\<`void`\>

This function reduces the allocated amount by an staker in an escrow and transfers those tokens to the reward pool. This allows the slasher to claim them later.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `slasher` | `string` | Wallet address from who requested the slash |
| `staker` | `string` | Wallet address from who is going to be slashed |
| `escrowAddress` | `string` | Address of the escrow which allocation will be slashed |
| `amount` | `bigint` | Amount in WEI of tokens to unstake. |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

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

const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.slash('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
```

#### Defined in

[staking.ts:387](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L387)

___

### stake

▸ **stake**(`amount`, `txOptions?`): `Promise`\<`void`\>

This function stakes a specified amount of tokens on a specific network.

> `approveStake` must be called before

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `bigint` | Amount in WEI of tokens to stake. |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

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

const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.approveStake(amount); // if it was already approved before, this is not necessary
await stakingClient.approveStake(amount);
```

#### Defined in

[staking.ts:258](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L258)

___

### unstake

▸ **unstake**(`amount`, `txOptions?`): `Promise`\<`void`\>

This function unstakes tokens from staking contract. The unstaked tokens stay locked for a period of time.

> Must have tokens available to unstake

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amount` | `bigint` | Amount in WEI of tokens to unstake. |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

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

const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.unstake(amount);
```

#### Defined in

[staking.ts:303](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L303)

___

### withdraw

▸ **withdraw**(`txOptions?`): `Promise`\<`void`\>

This function withdraws unstaked and non locked tokens form staking contract to the user wallet.

> Must have tokens available to withdraw

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

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

[staking.ts:349](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L349)

___

### build

▸ **build**(`runner`): `Promise`\<[`StakingClient`](staking.StakingClient.md)\>

Creates an instance of StakingClient from a Runner.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |

#### Returns

`Promise`\<[`StakingClient`](staking.StakingClient.md)\>

- An instance of StakingClient

**`Throws`**

- Thrown if the provider does not exist for the provided Signer

**`Throws`**

- Thrown if the network's chainId is not supported

#### Defined in

[staking.ts:145](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L145)
