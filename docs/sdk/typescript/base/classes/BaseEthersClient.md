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

[base.ts:20](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L20)

## Properties

### networkData

> **networkData**: [`NetworkData`](../../types/type-aliases/NetworkData.md)

#### Defined in

[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)

***

### runner

> `protected` **runner**: `ContractRunner`

#### Defined in

[base.ts:11](https://github.com/humanprotocol/human-protocol/blob/3ddf95c166a160d89d0a36078325a2fc8283f02c/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
