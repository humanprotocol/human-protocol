[@human-protocol/sdk](../README.md) / [Modules](../modules.md) / [base](../modules/base.md) / BaseEthersClient

# Class: BaseEthersClient

[base](../modules/base.md).BaseEthersClient

## Introduction

This class is used as a base class for other clients making on-chain calls.

## Hierarchy

- **`BaseEthersClient`**

  ↳ [`EscrowClient`](escrow.EscrowClient.md)

  ↳ [`KVStoreClient`](kvstore.KVStoreClient.md)

  ↳ [`StakingClient`](staking.StakingClient.md)

## Table of contents

### Constructors

- [constructor](base.BaseEthersClient.md#constructor)

### Properties

- [gasPriceMultiplier](base.BaseEthersClient.md#gaspricemultiplier)
- [networkData](base.BaseEthersClient.md#networkdata)
- [signerOrProvider](base.BaseEthersClient.md#signerorprovider)

### Methods

- [gasPriceOptions](base.BaseEthersClient.md#gaspriceoptions)

## Constructors

### constructor

• **new BaseEthersClient**(`signerOrProvider`, `networkData`, `gasPriceMultiplier?`)

**BaseClient constructor**

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signerOrProvider` | `Signer` \| `Provider` | The Signer or Provider object to interact with the Ethereum network |
| `networkData` | `NetworkData` | The network information required to connect to the contracts |
| `gasPriceMultiplier?` | `number` | The multiplier to apply to the gas price |

#### Defined in

base.ts:24

## Properties

### gasPriceMultiplier

• `Protected` `Optional` **gasPriceMultiplier**: `number`

#### Defined in

base.ts:14

___

### networkData

• **networkData**: `NetworkData`

#### Defined in

base.ts:15

___

### signerOrProvider

• `Protected` **signerOrProvider**: `Signer` \| `Provider`

#### Defined in

base.ts:13

## Methods

### gasPriceOptions

▸ `Protected` **gasPriceOptions**(): `Promise`<`Partial`<`Overrides`\>\>

Adjust the gas price, and return as an option to be passed to a transaction

#### Returns

`Promise`<`Partial`<`Overrides`\>\>

Returns the gas price options

#### Defined in

base.ts:39
