[**@human-protocol/sdk**](../../README.md) • **Docs**

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

• **runner**: `ContractRunner`

The Signer or Provider object to interact with the Ethereum network

• **networkData**: `NetworkData`

The network information required to connect to the contracts

#### Returns

[`BaseEthersClient`](BaseEthersClient.md)

#### Defined in

<<<<<<< HEAD
[base.ts:20](https://github.com/humanprotocol/human-protocol/blob/fa754a045070bb9969427d44e4db73f28ad75a06/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L20)
=======
[base.ts:20](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L20)
>>>>>>> develop

## Properties

### networkData

> **networkData**: `NetworkData`

#### Defined in

<<<<<<< HEAD
[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/fa754a045070bb9969427d44e4db73f28ad75a06/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)
=======
[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)
>>>>>>> develop

***

### runner

> `protected` **runner**: `ContractRunner`

#### Defined in

<<<<<<< HEAD
[base.ts:11](https://github.com/humanprotocol/human-protocol/blob/fa754a045070bb9969427d44e4db73f28ad75a06/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
=======
[base.ts:11](https://github.com/humanprotocol/human-protocol/blob/0b3839952b697011b6b5a2ed2d456d3d85ce02c7/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
>>>>>>> develop
