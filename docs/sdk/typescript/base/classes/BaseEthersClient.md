[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [base](../README.md) / BaseEthersClient

# Class: `abstract` BaseEthersClient

Defined in: [base.ts:10](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L10)

## Introduction

This class is used as a base class for other clients making on-chain calls.

## Extended by

- [`EscrowClient`](../../escrow/classes/EscrowClient.md)
- [`KVStoreClient`](../../kvstore/classes/KVStoreClient.md)
- [`StakingClient`](../../staking/classes/StakingClient.md)

## Constructors

### Constructor

> **new BaseEthersClient**(`runner`, `networkData`): `BaseEthersClient`

Defined in: [base.ts:20](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L20)

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

Defined in: [base.ts:12](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)

***

### runner

> `protected` **runner**: `ContractRunner`

Defined in: [base.ts:11](https://github.com/humanprotocol/human-protocol/blob/47f5da5838a126d0f0ff22cdaa7719befd2657b4/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
