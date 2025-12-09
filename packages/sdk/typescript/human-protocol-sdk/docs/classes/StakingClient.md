Client for staking actions on HUMAN Protocol.

Internally, the SDK will use one network or another according to the network ID of the `runner`.
To use this client, it is recommended to initialize it using the static `build` method.

```ts
static async build(runner: ContractRunner): Promise<StakingClient>;
```

A `Signer` or a `Provider` should be passed depending on the use case of this module:

- **Signer**: when the user wants to use this model to send transactions calling the contract functions.
- **Provider**: when the user wants to use this model to get information from the contracts or subgraph.

## Example

###Using Signer

####Using private key (backend)

```ts
import { StakingClient } from '@human-protocol/sdk';
import { Wallet, JsonRpcProvider } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const stakingClient = await StakingClient.build(signer);
```

####Using Wagmi (frontend)

```ts
import { useSigner, useChainId } from 'wagmi';
import { StakingClient } from '@human-protocol/sdk';

const { data: signer } = useSigner();
const stakingClient = await StakingClient.build(signer);
```

###Using Provider

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

| Type | Description |
|------|-------------|
| `StakingClient` | - |

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

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |


#### Returns

| Type | Description |
|------|-------------|
| `StakingClient` | An instance of StakingClient |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorProviderDoesNotExist` | If the provider does not exist for the provided Signer |
| `ErrorUnsupportedChainID` | If the network's chainId is not supported |

???+ example "Example"

    ```ts
    import { StakingClient } from '@human-protocol/sdk';
    import { Wallet, JsonRpcProvider } from 'ethers';
    
    const rpcUrl = 'YOUR_RPC_URL';
    const privateKey = 'YOUR_PRIVATE_KEY';
    
    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(privateKey, provider);
    const stakingClient = await StakingClient.build(signer);
    ```


***

### approveStake()

```ts
approveStake(amount: bigint, txOptions: Overrides): Promise<void>;
```

This function approves the staking contract to transfer a specified amount of tokens when the user stakes. It increases the allowance for the staking contract.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `amount` | `bigint` | Amount in WEI of tokens to approve for stake. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidStakingValueType` | If the amount is not a bigint |
| `ErrorInvalidStakingValueSign` | If the amount is negative |

???+ example "Example"

    ```ts
    import { ethers } from 'ethers';
    
    const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
    await stakingClient.approveStake(amount);
    ```


***

### stake()

```ts
stake(amount: bigint, txOptions: Overrides): Promise<void>;
```

This function stakes a specified amount of tokens on a specific network.

!!! note
    `approveStake` must be called before

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `amount` | `bigint` | Amount in WEI of tokens to stake. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidStakingValueType` | If the amount is not a bigint |
| `ErrorInvalidStakingValueSign` | If the amount is negative |

???+ example "Example"

    ```ts
    import { ethers } from 'ethers';
    
    const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
    await stakingClient.approveStake(amount); // if it was already approved before, this is not necessary
    await stakingClient.stake(amount);
    ```


***

### unstake()

```ts
unstake(amount: bigint, txOptions: Overrides): Promise<void>;
```

This function unstakes tokens from staking contract. The unstaked tokens stay locked for a period of time.

!!! note
    Must have tokens available to unstake

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `amount` | `bigint` | Amount in WEI of tokens to unstake. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidStakingValueType` | If the amount is not a bigint |
| `ErrorInvalidStakingValueSign` | If the amount is negative |

???+ example "Example"

    ```ts
    import { ethers } from 'ethers';
    
    const amount = ethers.parseUnits('5', 'ether'); //convert from ETH to WEI
    await stakingClient.unstake(amount);
    ```


***

### withdraw()

```ts
withdraw(txOptions: Overrides): Promise<void>;
```

This function withdraws unstaked and non-locked tokens from staking contract to the user wallet.
!!! note
    Must have tokens available to withdraw

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

???+ example "Example"

    ```ts
    await stakingClient.withdraw();
    ```


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

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `slasher` | `string` | Wallet address from who requested the slash |
| `staker` | `string` | Wallet address from who is going to be slashed |
| `escrowAddress` | `string` | Address of the escrow that the slash is made |
| `amount` | `bigint` | Amount in WEI of tokens to slash. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidStakingValueType` | If the amount is not a bigint |
| `ErrorInvalidStakingValueSign` | If the amount is negative |
| `ErrorInvalidSlasherAddressProvided` | If the slasher address is invalid |
| `ErrorInvalidStakerAddressProvided` | If the staker address is invalid |
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

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


***

### getStakerInfo()

```ts
getStakerInfo(stakerAddress: string): Promise<StakerInfo>;
```

Retrieves comprehensive staking information for a staker.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `stakerAddress` | `string` | The address of the staker. |


#### Returns

| Type | Description |
|------|-------------|
| `StakerInfo` | Staking information for the staker |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidStakerAddressProvided` | If the staker address is invalid |

???+ example "Example"

    ```ts
    const stakingInfo = await stakingClient.getStakerInfo('0xYourStakerAddress');
    console.log('Tokens staked:', stakingInfo.stakedAmount);
    ```

