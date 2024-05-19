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

- [networkData](base.BaseEthersClient.md#networkdata)
- [runner](base.BaseEthersClient.md#runner)

## Constructors

### constructor

• **new BaseEthersClient**(`runner`, `networkData`): [`BaseEthersClient`](base.BaseEthersClient.md)

**BaseClient constructor**

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `runner` | `ContractRunner` | The Signer or Provider object to interact with the Ethereum network |
| `networkData` | `NetworkData` | The network information required to connect to the contracts |

#### Returns

[`BaseEthersClient`](base.BaseEthersClient.md)

#### Defined in

[base.ts:20](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L20)

## Properties

### networkData

• **networkData**: `NetworkData`

#### Defined in

[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)

___

### runner

• `Protected` **runner**: `ContractRunner`

#### Defined in

[base.ts:11](https://github.com/humanprotocol/human-protocol/blob/8179ff73c30c2ea6568c8117ee6bfef4035cf2d4/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)
