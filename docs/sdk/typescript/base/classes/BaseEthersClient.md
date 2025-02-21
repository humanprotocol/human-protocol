[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [base](../README.md) / BaseEthersClient

# Class: `abstract` BaseEthersClient

## Introduction

This class is used as a base class for other clients making on-chain calls.

## Extended by

- [`EscrowClient`](../../escrow/classes/EscrowClient.md)
- [`KVStoreClient`](../../kvstore/classes/KVStoreClient.md)
- [`StakingClient`](../../staking/classes/StakingClient.md)

## Constructors

### new BaseEthersClient()

> **new BaseEthersClient**(`runner`, `networkData`): [`BaseEthersClient`](BaseEthersClient.md)

**BaseClient constructor**

#### Parameters

##### runner

`ContractRunner`

The Signer or Provider object to interact with the Ethereum network

##### networkData

[`NetworkData`](../../types/type-aliases/NetworkData.md)

The network information required to connect to the contracts

#### Returns

[`BaseEthersClient`](BaseEthersClient.md)

#### Defined in

<<<<<<< HEAD
[base.ts:20](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L20)
=======
[base.ts:20](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L20)
>>>>>>> develop

## Properties

### networkData

> **networkData**: [`NetworkData`](../../types/type-aliases/NetworkData.md)

#### Defined in

<<<<<<< HEAD
[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)
=======
[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)
>>>>>>> develop

***

### runner

> `protected` **runner**: `ContractRunner`

#### Defined in

<<<<<<< HEAD
[base.ts:11](https://github.com/humanprotocol/human-protocol/blob/9a36dcc76397ebaf05988194a5c5bf379999302c/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
=======
[base.ts:11](https://github.com/humanprotocol/human-protocol/blob/b718aa9d178d605c5b27fec98a4e6afa6f1db599/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
>>>>>>> develop
