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

#### Source

[base.ts:20](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L20)

## Properties

### networkData

> **networkData**: `NetworkData`

#### Source

[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)

***

### runner

> `protected` **runner**: `ContractRunner`

#### Source

[base.ts:11](https://github.com/humanprotocol/human-protocol/blob/00c0ef1cd5e15fe55363c28d74cb730c10dfa5a9/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
