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
import { Wallet, JsonRpcProvider } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new JsonRpcProvider(rpcUrl);
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
import { JsonRpcProvider } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new JsonRpcProvider(rpcUrl);
const stakingClient = await StakingClient.build(provider);
```

## Extends

- `BaseEthersClient`

## Constructors

### Constructor

```ts
new StakingClient(runner: ContractRunner, networkData: NetworkData): StakingClient;
```

**StakingClient constructor**

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |
| `networkData` | [`NetworkData`](../type-aliases/NetworkData.md) | The network information required to connect to the Staking contract |

#### Returns

`StakingClient`

#### Overrides

```ts
BaseEthersClient.constructor
```

## Methods

### build()

```ts
static build(runner: ContractRunner): Promise<StakingClient>;
```

Creates an instance of StakingClient from a Runner.

#### Throws

ErrorProviderDoesNotExist If the provider does not exist for the provided Signer

#### Throws

ErrorUnsupportedChainID If the network's chainId is not supported

#### Example

```ts
import { StakingClient } from '@human-protocol/sdk';
import { Wallet, JsonRpcProvider } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |

#### Returns

`Promise`\<`StakingClient`\>

An instance of StakingClient

***

### approveStake()

```ts
approveStake(amount: bigint, txOptions: Overrides): Promise<void>;
```

This function approves the staking contract to transfer a specified amount of tokens when the user stakes. It increases the allowance for the staking contract.

#### Throws

ErrorInvalidStakingValueType If the amount is not a bigint

#### Throws

ErrorInvalidStakingValueSign If the amount is negative

#### Example

```ts
import { ethers } from 'ethers';

const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
await stakingClient.approveStake(amount);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `amount` | `bigint` | Amount in WEI of tokens to approve for stake. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### stake()

```ts
stake(amount: bigint, txOptions: Overrides): Promise<void>;
```

This function stakes a specified amount of tokens on a specific network.

> `approveStake` must be called before

#### Throws

ErrorInvalidStakingValueType If the amount is not a bigint

#### Throws

ErrorInvalidStakingValueSign If the amount is negative

#### Example

```ts
import { ethers } from 'ethers';

const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
await stakingClient.approveStake(amount); // if it was already approved before, this is not necessary
await stakingClient.stake(amount);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `amount` | `bigint` | Amount in WEI of tokens to stake. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### unstake()

```ts
unstake(amount: bigint, txOptions: Overrides): Promise<void>;
```

This function unstakes tokens from staking contract. The unstaked tokens stay locked for a period of time.

> Must have tokens available to unstake

#### Throws

ErrorInvalidStakingValueType If the amount is not a bigint

#### Throws

ErrorInvalidStakingValueSign If the amount is negative

#### Example

```ts
import { ethers } from 'ethers';

const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
await stakingClient.unstake(amount);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `amount` | `bigint` | Amount in WEI of tokens to unstake. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### withdraw()

```ts
withdraw(txOptions: Overrides): Promise<void>;
```

This function withdraws unstaked and non-locked tokens from staking contract to the user wallet.

> Must have tokens available to withdraw

#### Example

```ts
await stakingClient.withdraw();
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### slash()

```ts
slash(
   slasher: string, 
   staker: string, 
   escrowAddress: string, 
   amount: bigint, 
txOptions: Overrides): Promise<void>;
```

This function reduces the allocated amount by a staker in an escrow and transfers those tokens to the reward pool. This allows the slasher to claim them later.

#### Throws

ErrorInvalidStakingValueType If the amount is not a bigint

#### Throws

ErrorInvalidStakingValueSign If the amount is negative

#### Throws

ErrorInvalidSlasherAddressProvided If the slasher address is invalid

#### Throws

ErrorInvalidStakerAddressProvided If the staker address is invalid

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
import { ethers } from 'ethers';

const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
await stakingClient.slash(
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
  amount
);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `slasher` | `string` | Wallet address from who requested the slash |
| `staker` | `string` | Wallet address from who is going to be slashed |
| `escrowAddress` | `string` | Address of the escrow that the slash is made |
| `amount` | `bigint` | Amount in WEI of tokens to slash. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### getStakerInfo()

```ts
getStakerInfo(stakerAddress: string): Promise<StakerInfo>;
```

Retrieves comprehensive staking information for a staker.

#### Throws

ErrorInvalidStakerAddressProvided If the staker address is invalid

#### Example

```ts
const stakingInfo = await stakingClient.getStakerInfo('0xYourStakerAddress');
console.log('Tokens staked:', stakingInfo.stakedAmount);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `stakerAddress` | `string` | The address of the staker. |

#### Returns

`Promise`\<`StakerInfo`\>

Staking information for the staker
