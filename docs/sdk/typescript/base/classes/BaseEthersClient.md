[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [base](../README.md) / BaseEthersClient

# Abstract Class: BaseEthersClient

<<<<<<< HEAD
Defined in: [base.ts:10](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L10)
=======
Defined in: [base.ts:10](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L10)
>>>>>>> develop

## Introduction

This class is used as a base class for other clients making on-chain calls.

## Extended by

- [`EscrowClient`](../../escrow/classes/EscrowClient.md)
- [`KVStoreClient`](../../kvstore/classes/KVStoreClient.md)
- [`StakingClient`](../../staking/classes/StakingClient.md)

## Constructors

### Constructor

> **new BaseEthersClient**(`runner`, `networkData`): `BaseEthersClient`

<<<<<<< HEAD
Defined in: [base.ts:20](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L20)
=======
Defined in: [base.ts:20](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L20)
>>>>>>> develop

**BaseClient constructor**

#### Parameters

##### runner

`ContractRunner`

The Signer or Provider object to interact with the Ethereum network

##### networkData

[`NetworkData`](../../types/type-aliases/NetworkData.md)

The network information required to connect to the contracts

#### Returns

`BaseEthersClient`

## Properties

### networkData

> **networkData**: [`NetworkData`](../../types/type-aliases/NetworkData.md)

<<<<<<< HEAD
Defined in: [base.ts:12](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)
=======
Defined in: [base.ts:12](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)
>>>>>>> develop

***

### runner

> `protected` **runner**: `ContractRunner`

<<<<<<< HEAD
Defined in: [base.ts:11](https://github.com/humanprotocol/human-protocol/blob/daa33ac30e8a8fd3dd7bbd077ced2e0ab16f7bab/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
=======
Defined in: [base.ts:11](https://github.com/humanprotocol/human-protocol/blob/8c6afbe01e352b593635124b575731df11c509c7/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
>>>>>>> develop
