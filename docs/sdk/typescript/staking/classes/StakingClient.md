[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [staking](../README.md) / StakingClient

# Class: StakingClient

<<<<<<< HEAD
Defined in: [staking.ts:103](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L103)
=======
Defined in: [staking.ts:97](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L97)
>>>>>>> develop

## Introduction

This client enables performing actions on staking contracts and obtaining staking information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the `runner`.
To use this client, it is recommended to initialize it using the static `build` method.

```ts
static async build(runner: ContractRunner): Promise<StakingClient>;
```

A `Signer` or a `Provider` should be passed depending on the use case of this module:

- **Signer**: when the user wants to use this model to send transactions calling the contract functions.
- **Provider**: when the user wants to use this model to get information from the contracts or subgraph.

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

**Using private key (backend)**

```ts
import { StakingClient } from '@human-protocol/sdk';
import { Wallet, providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);
```

**Using Wagmi (frontend)**

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

## Extends

- [`BaseEthersClient`](../../base/classes/BaseEthersClient.md)

## Constructors

### Constructor

> **new StakingClient**(`runner`, `networkData`): `StakingClient`

<<<<<<< HEAD
Defined in: [staking.ts:114](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L114)
=======
Defined in: [staking.ts:108](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L108)
>>>>>>> develop

**StakingClient constructor**

#### Parameters

##### runner

`ContractRunner`

The Runner object to interact with the Ethereum network

##### networkData

[`NetworkData`](../../types/type-aliases/NetworkData.md)

The network information required to connect to the Staking contract

#### Returns

`StakingClient`

#### Overrides

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`constructor`](../../base/classes/BaseEthersClient.md#constructor)

## Properties

### escrowFactoryContract

> **escrowFactoryContract**: `EscrowFactory`

<<<<<<< HEAD
Defined in: [staking.ts:106](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L106)
=======
Defined in: [staking.ts:100](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L100)
>>>>>>> develop

***

### networkData

> **networkData**: [`NetworkData`](../../types/type-aliases/NetworkData.md)

<<<<<<< HEAD
Defined in: [base.ts:12](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)
=======
Defined in: [base.ts:12](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)
>>>>>>> develop

#### Inherited from

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`networkData`](../../base/classes/BaseEthersClient.md#networkdata)

***

### runner

> `protected` **runner**: `ContractRunner`

<<<<<<< HEAD
Defined in: [base.ts:11](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
=======
Defined in: [base.ts:11](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
>>>>>>> develop

#### Inherited from

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`runner`](../../base/classes/BaseEthersClient.md#runner)

***

### stakingContract

> **stakingContract**: `Staking`

<<<<<<< HEAD
Defined in: [staking.ts:105](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L105)
=======
Defined in: [staking.ts:99](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L99)
>>>>>>> develop

***

### tokenContract

> **tokenContract**: `HMToken`

<<<<<<< HEAD
Defined in: [staking.ts:104](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L104)
=======
Defined in: [staking.ts:98](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L98)
>>>>>>> develop

## Methods

### approveStake()

> **approveStake**(`amount`, `txOptions?`): `Promise`\<`void`\>

<<<<<<< HEAD
Defined in: [staking.ts:199](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L199)
=======
Defined in: [staking.ts:193](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L193)
>>>>>>> develop

This function approves the staking contract to transfer a specified amount of tokens when the user stakes. It increases the allowance for the staking contract.

#### Parameters

##### amount

`bigint`

Amount in WEI of tokens to approve for stake.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { ethers, Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.approveStake(amount);
```

***

### getStakerInfo()

> **getStakerInfo**(`stakerAddress`): `Promise`\<[`StakerInfo`](../../interfaces/interfaces/StakerInfo.md)\>

<<<<<<< HEAD
Defined in: [staking.ts:441](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L441)
=======
Defined in: [staking.ts:435](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L435)
>>>>>>> develop

Retrieves comprehensive staking information for a staker.

#### Parameters

##### stakerAddress

`string`

The address of the staker.

#### Returns

`Promise`\<[`StakerInfo`](../../interfaces/interfaces/StakerInfo.md)\>

**Code example**

```ts
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const stakingClient = await StakingClient.build(provider);

const stakingInfo = await stakingClient.getStakerInfo('0xYourStakerAddress');
console.log(stakingInfo.tokensStaked);
```

***

### slash()

> **slash**(`slasher`, `staker`, `escrowAddress`, `amount`, `txOptions?`): `Promise`\<`void`\>

<<<<<<< HEAD
Defined in: [staking.ts:379](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L379)
=======
Defined in: [staking.ts:373](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L373)
>>>>>>> develop

This function reduces the allocated amount by a staker in an escrow and transfers those tokens to the reward pool. This allows the slasher to claim them later.

#### Parameters

##### slasher

`string`

Wallet address from who requested the slash

##### staker

`string`

Wallet address from who is going to be slashed

##### escrowAddress

`string`

Address of the escrow that the slash is made

##### amount

`bigint`

Amount in WEI of tokens to slash.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { ethers, Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.slash('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
```

***

### stake()

> **stake**(`amount`, `txOptions?`): `Promise`\<`void`\>

<<<<<<< HEAD
Defined in: [staking.ts:253](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L253)
=======
Defined in: [staking.ts:247](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L247)
>>>>>>> develop

This function stakes a specified amount of tokens on a specific network.

> `approveStake` must be called before

#### Parameters

##### amount

`bigint`

Amount in WEI of tokens to stake.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { ethers, Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.approveStake(amount); // if it was already approved before, this is not necessary
await stakingClient.stake(amount);
```

***

### unstake()

> **unstake**(`amount`, `txOptions?`): `Promise`\<`void`\>

<<<<<<< HEAD
Defined in: [staking.ts:297](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L297)
=======
Defined in: [staking.ts:291](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L291)
>>>>>>> develop

This function unstakes tokens from staking contract. The unstaked tokens stay locked for a period of time.

> Must have tokens available to unstake

#### Parameters

##### amount

`bigint`

Amount in WEI of tokens to unstake.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { ethers, Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
await stakingClient.unstake(amount);
```

***

### withdraw()

> **withdraw**(`txOptions?`): `Promise`\<`void`\>

<<<<<<< HEAD
Defined in: [staking.ts:342](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L342)
=======
Defined in: [staking.ts:336](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L336)
>>>>>>> develop

This function withdraws unstaked and non-locked tokens from staking contract to the user wallet.

> Must have tokens available to withdraw

#### Parameters

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { Wallet, providers } from 'ethers';
import { StakingClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);

await stakingClient.withdraw();
```

***

### build()

> `static` **build**(`runner`): `Promise`\<`StakingClient`\>

<<<<<<< HEAD
Defined in: [staking.ts:142](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L142)
=======
Defined in: [staking.ts:136](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/staking.ts#L136)
>>>>>>> develop

Creates an instance of StakingClient from a Runner.

#### Parameters

##### runner

`ContractRunner`

The Runner object to interact with the Ethereum network

#### Returns

`Promise`\<`StakingClient`\>

- An instance of StakingClient

#### Throws

- Thrown if the provider does not exist for the provided Signer

#### Throws

- Thrown if the network's chainId is not supported
