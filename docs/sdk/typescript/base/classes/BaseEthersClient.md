[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [base](../README.md) / BaseEthersClient

# Abstract Class: BaseEthersClient

Defined in: [base.ts:12](https://github.com/humanprotocol/human-protocol/blob/111a3dfb8ed775487998fa7cc407fdc884e7a927/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)

## Introduction

This class is used as a base class for other clients making on-chain calls.

## Extended by

- [`EscrowClient`](../../escrow/classes/EscrowClient.md)
- [`KVStoreClient`](../../kvstore/classes/KVStoreClient.md)
- [`StakingClient`](../../staking/classes/StakingClient.md)

## Constructors

### Constructor

> **new BaseEthersClient**(`runner`, `networkData`): `BaseEthersClient`

Defined in: [base.ts:22](https://github.com/humanprotocol/human-protocol/blob/111a3dfb8ed775487998fa7cc407fdc884e7a927/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L22)

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

Defined in: [base.ts:14](https://github.com/humanprotocol/human-protocol/blob/111a3dfb8ed775487998fa7cc407fdc884e7a927/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L14)

***

### runner

> `protected` **runner**: `ContractRunner`

Defined in: [base.ts:13](https://github.com/humanprotocol/human-protocol/blob/111a3dfb8ed775487998fa7cc407fdc884e7a927/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L13)

## Methods

### applyTxDefaults()

> `protected` **applyTxDefaults**(`txOptions`): `Overrides`

Defined in: [base.ts:35](https://github.com/humanprotocol/human-protocol/blob/111a3dfb8ed775487998fa7cc407fdc884e7a927/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L35)

Internal helper to enrich transaction overrides with network specific defaults.

Aurora networks use a fixed gas price. We always override any user provided
gasPrice with the canonical DEFAULT_AURORA_GAS_PRICE to avoid mismatches
or tx failures due to an unexpected value. For other networks the user
supplied fee parameters are left untouched.

#### Parameters

##### txOptions

`Overrides` = `{}`

#### Returns

`Overrides`
