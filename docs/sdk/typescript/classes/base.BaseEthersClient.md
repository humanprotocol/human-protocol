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
- [signerOrProvider](base.BaseEthersClient.md#signerorprovider)

## Constructors

### constructor

• **new BaseEthersClient**(`signerOrProvider`, `networkData`): [`BaseEthersClient`](base.BaseEthersClient.md)

**BaseClient constructor**

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signerOrProvider` | `Signer` \| `Provider` | The Signer or Provider object to interact with the Ethereum network |
| `networkData` | `NetworkData` | The network information required to connect to the contracts |

#### Returns

[`BaseEthersClient`](base.BaseEthersClient.md)

#### Defined in

[base.ts:21](https://github.com/humanprotocol/human-protocol/blob/47ca9511/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L21)

## Properties

### networkData

• **networkData**: `NetworkData`

#### Defined in

[base.ts:13](https://github.com/humanprotocol/human-protocol/blob/47ca9511/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L13)

___

### signerOrProvider

• `Protected` **signerOrProvider**: `Signer` \| `Provider`

#### Defined in

[base.ts:12](https://github.com/humanprotocol/human-protocol/blob/47ca9511/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)
