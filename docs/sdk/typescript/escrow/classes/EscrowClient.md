[**@human-protocol/sdk**](../../README.md)

***

[@human-protocol/sdk](../../modules.md) / [escrow](../README.md) / EscrowClient

# Class: EscrowClient

Defined in: [escrow.ts:142](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L142)

## Introduction

This client enables performing actions on Escrow contracts and obtaining information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the `runner`.
To use this client, it is recommended to initialize it using the static `build` method.

```ts
static async build(runner: ContractRunner): Promise<EscrowClient>;
```

A `Signer` or a `Provider` should be passed depending on the use case of this module:

- **Signer**: when the user wants to use this model to send transactions calling the contract functions.
- **Provider**: when the user wants to use this model to get information from the contracts or subgraph.

## Installation

### npm
```bash
npm install @human-protocol/sdk
```

### yarn
```bash
yarn install @human-protocol/sdk
```

## Code example

### Signer

**Using private key (backend)**

```ts
import { EscrowClient } from '@human-protocol/sdk';
import { Wallet, providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);
```

**Using Wagmi (frontend)**

```ts
import { useSigner, useChainId } from 'wagmi';
import { EscrowClient } from '@human-protocol/sdk';

const { data: signer } = useSigner();
const escrowClient = await EscrowClient.build(signer);
```

### Provider

```ts
import { EscrowClient } from '@human-protocol/sdk';
import { providers } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);
```

## Extends

- [`BaseEthersClient`](../../base/classes/BaseEthersClient.md)

## Constructors

### Constructor

> **new EscrowClient**(`runner`, `networkData`): `EscrowClient`

Defined in: [escrow.ts:151](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L151)

**EscrowClient constructor**

#### Parameters

##### runner

`ContractRunner`

The Runner object to interact with the Ethereum network

##### networkData

[`NetworkData`](../../types/type-aliases/NetworkData.md)

The network information required to connect to the Escrow contract

#### Returns

`EscrowClient`

#### Overrides

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`constructor`](../../base/classes/BaseEthersClient.md#constructor)

## Properties

### networkData

> **networkData**: [`NetworkData`](../../types/type-aliases/NetworkData.md)

Defined in: [base.ts:12](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L12)

#### Inherited from

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`networkData`](../../base/classes/BaseEthersClient.md#networkdata)

***

### runner

> `protected` **runner**: `ContractRunner`

Defined in: [base.ts:11](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/base.ts#L11)

#### Inherited from

[`BaseEthersClient`](../../base/classes/BaseEthersClient.md).[`runner`](../../base/classes/BaseEthersClient.md#runner)

## Methods

### addTrustedHandlers()

> **addTrustedHandlers**(`escrowAddress`, `trustedHandlers`, `txOptions?`): `Promise`\<`void`\>

Defined in: [escrow.ts:779](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L779)

This function adds an array of addresses to the trusted handlers list.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

##### trustedHandlers

`string`[]

Array of addresses of trusted handlers to add.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

> Only Job Launcher or trusted handler can call it.

```ts
import { Wallet, providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);

const trustedHandlers = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
await escrowClient.addTrustedHandlers('0x62dD51230A30401C455c8398d06F85e4EaB6309f', trustedHandlers);
```

***

### bulkPayOut()

> **bulkPayOut**(`escrowAddress`, `recipients`, `amounts`, `finalResultsUrl`, `finalResultsHash`, `txId`, `forceComplete`, `txOptions?`): `Promise`\<`void`\>

Defined in: [escrow.ts:612](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L612)

This function pays out the amounts specified to the workers and sets the URL of the final results file.

#### Parameters

##### escrowAddress

`string`

Escrow address to payout.

##### recipients

`string`[]

Array of recipient addresses.

##### amounts

`bigint`[]

Array of amounts the recipients will receive.

##### finalResultsUrl

`string`

Final results file URL.

##### finalResultsHash

`string`

Final results file hash.

##### txId

`number`

Transaction ID.

##### forceComplete

`boolean` = `false`

Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false).

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

> Only Reputation Oracle or a trusted handler can call it.

```ts
import { ethers, Wallet, providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);

const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
const amounts = [ethers.parseUnits(5, 'ether'), ethers.parseUnits(10, 'ether')];
const resultsUrl = 'http://localhost/results.json';
const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
const txId = 1;

await escrowClient.bulkPayOut('0x62dD51230A30401C455c8398d06F85e4EaB6309f', recipients, amounts, resultsUrl, resultsHash, txId);
```

***

### cancel()

> **cancel**(`escrowAddress`, `txOptions?`): `Promise`\<[`EscrowCancel`](../../types/type-aliases/EscrowCancel.md)\>

Defined in: [escrow.ts:693](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L693)

This function cancels the specified escrow and sends the balance to the canceler.

#### Parameters

##### escrowAddress

`string`

Address of the escrow to cancel.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<[`EscrowCancel`](../../types/type-aliases/EscrowCancel.md)\>

Returns the escrow cancellation data including transaction hash and refunded amount. Throws error if any.

**Code example**

> Only Job Launcher or a trusted handler can call it.

```ts
import { ethers, Wallet, providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);

await escrowClient.cancel('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### complete()

> **complete**(`escrowAddress`, `txOptions?`): `Promise`\<`void`\>

Defined in: [escrow.ts:551](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L551)

This function sets the status of an escrow to completed.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

> Only Recording Oracle or a trusted handler can call it.

```ts
import { Wallet, providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);

await escrowClient.complete('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### createBulkPayoutTransaction()

> **createBulkPayoutTransaction**(`escrowAddress`, `recipients`, `amounts`, `finalResultsUrl`, `finalResultsHash`, `txId`, `forceComplete`, `txOptions?`): `Promise`\<[`TransactionLikeWithNonce`](../../types/type-aliases/TransactionLikeWithNonce.md)\>

Defined in: [escrow.ts:948](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L948)

Creates a prepared transaction for bulk payout without immediately sending it.

#### Parameters

##### escrowAddress

`string`

Escrow address to payout.

##### recipients

`string`[]

Array of recipient addresses.

##### amounts

`bigint`[]

Array of amounts the recipients will receive.

##### finalResultsUrl

`string`

Final results file URL.

##### finalResultsHash

`string`

Final results file hash.

##### txId

`number`

Transaction ID.

##### forceComplete

`boolean` = `false`

Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false).

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<[`TransactionLikeWithNonce`](../../types/type-aliases/TransactionLikeWithNonce.md)\>

Returns object with raw transaction and signed transaction hash

**Code example**

> Only Reputation Oracle or a trusted handler can call it.

```ts
import { ethers, Wallet, providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY'

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);

const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
const amounts = [ethers.parseUnits(5, 'ether'), ethers.parseUnits(10, 'ether')];
const resultsUrl = 'http://localhost/results.json';
const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
const txId = 1;

const rawTransaction = await escrowClient.createBulkPayoutTransaction('0x62dD51230A30401C455c8398d06F85e4EaB6309f', recipients, amounts, resultsUrl, resultsHash, txId);
console.log('Raw transaction:', rawTransaction);

const signedTransaction = await signer.signTransaction(rawTransaction);
console.log('Tx hash:', ethers.keccak256(signedTransaction));
(await signer.sendTransaction(rawTransaction)).wait();

***

### createEscrow()

> **createEscrow**(`tokenAddress`, `trustedHandlers`, `jobRequesterId`, `txOptions?`): `Promise`\<`string`\>

Defined in: [escrow.ts:231](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L231)

This function creates an escrow contract that uses the token passed to pay oracle fees and reward workers.

#### Parameters

##### tokenAddress

`string`

Token address to use for payouts.

##### trustedHandlers

`string`[]

Array of addresses that can perform actions on the contract.

##### jobRequesterId

`string`

Job Requester Id

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`string`\>

Returns the address of the escrow created.

**Code example**

> Need to have available stake.

```ts
import { Wallet, providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);

const tokenAddress = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4';
const trustedHandlers = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'];
const jobRequesterId = "job-requester-id";
const escrowAddress = await escrowClient.createEscrow(tokenAddress, trustedHandlers, jobRequesterId);
```

***

### fund()

> **fund**(`escrowAddress`, `amount`, `txOptions?`): `Promise`\<`void`\>

Defined in: [escrow.ts:422](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L422)

This function adds funds of the chosen token to the escrow.

#### Parameters

##### escrowAddress

`string`

Address of the escrow to fund.

##### amount

`bigint`

Amount to be added as funds.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

```ts
import { ethers, Wallet, providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);

const amount = ethers.parseUnits(5, 'ether'); //convert from ETH to WEI
await escrowClient.fund('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
```

***

### getBalance()

> **getBalance**(`escrowAddress`): `Promise`\<`bigint`\>

Defined in: [escrow.ts:1093](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1093)

This function returns the balance for a specified escrow address.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`bigint`\>

Balance of the escrow in the token used to fund it.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const balance = await escrowClient.getBalance('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getExchangeOracleAddress()

> **getExchangeOracleAddress**(`escrowAddress`): `Promise`\<`string`\>

Defined in: [escrow.ts:1479](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1479)

This function returns the exchange oracle address for a given escrow.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`string`\>

Address of the Exchange Oracle.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const oracleAddress = await escrowClient.getExchangeOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getFactoryAddress()

> **getFactoryAddress**(`escrowAddress`): `Promise`\<`string`\>

Defined in: [escrow.ts:1517](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1517)

This function returns the escrow factory address for a given escrow.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`string`\>

Address of the escrow factory.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const factoryAddress = await escrowClient.getFactoryAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getIntermediateResultsUrl()

> **getIntermediateResultsUrl**(`escrowAddress`): `Promise`\<`string`\>

Defined in: [escrow.ts:1251](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1251)

This function returns the intermediate results file URL.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`string`\>

Url of the file that store results from Recording Oracle.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const intermediateResultsUrl = await escrowClient.getIntermediateResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getJobLauncherAddress()

> **getJobLauncherAddress**(`escrowAddress`): `Promise`\<`string`\>

Defined in: [escrow.ts:1403](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1403)

This function returns the job launcher address for a given escrow.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`string`\>

Address of the Job Launcher.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const jobLauncherAddress = await escrowClient.getJobLauncherAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getManifestHash()

> **getManifestHash**(`escrowAddress`): `Promise`\<`string`\>

Defined in: [escrow.ts:1137](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1137)

This function returns the manifest file hash.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`string`\>

Hash of the manifest file content.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const manifestHash = await escrowClient.getManifestHash('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getManifestUrl()

> **getManifestUrl**(`escrowAddress`): `Promise`\<`string`\>

Defined in: [escrow.ts:1175](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1175)

This function returns the manifest file URL.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`string`\>

Url of the manifest.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const manifestUrl = await escrowClient.getManifestUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getRecordingOracleAddress()

> **getRecordingOracleAddress**(`escrowAddress`): `Promise`\<`string`\>

Defined in: [escrow.ts:1365](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1365)

This function returns the recording oracle address for a given escrow.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`string`\>

Address of the Recording Oracle.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const oracleAddress = await escrowClient.getRecordingOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getReputationOracleAddress()

> **getReputationOracleAddress**(`escrowAddress`): `Promise`\<`string`\>

Defined in: [escrow.ts:1441](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1441)

This function returns the reputation oracle address for a given escrow.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`string`\>

Address of the Reputation Oracle.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const oracleAddress = await escrowClient.getReputationOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getResultsUrl()

> **getResultsUrl**(`escrowAddress`): `Promise`\<`string`\>

Defined in: [escrow.ts:1213](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1213)

This function returns the results file URL.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`string`\>

Results file url.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const resultsUrl = await escrowClient.getResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getStatus()

> **getStatus**(`escrowAddress`): `Promise`\<[`EscrowStatus`](../../types/enumerations/EscrowStatus.md)\>

Defined in: [escrow.ts:1327](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1327)

This function returns the current status of the escrow.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<[`EscrowStatus`](../../types/enumerations/EscrowStatus.md)\>

Current status of the escrow.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const status = await escrowClient.getStatus('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### getTokenAddress()

> **getTokenAddress**(`escrowAddress`): `Promise`\<`string`\>

Defined in: [escrow.ts:1289](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L1289)

This function returns the token address used for funding the escrow.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

#### Returns

`Promise`\<`string`\>

Address of the token used to fund the escrow.

**Code example**

```ts
import { providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';

const provider = new providers.JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);

const tokenAddress = await escrowClient.getTokenAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

***

### setup()

> **setup**(`escrowAddress`, `escrowConfig`, `txOptions?`): `Promise`\<`void`\>

Defined in: [escrow.ts:312](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L312)

This function sets up the parameters of the escrow.

#### Parameters

##### escrowAddress

`string`

Address of the escrow to set up.

##### escrowConfig

[`IEscrowConfig`](../../interfaces/interfaces/IEscrowConfig.md)

Escrow configuration parameters.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

> Only Job Launcher or a trusted handler can call it.

```ts
import { Wallet, providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);

const escrowAddress = '0x62dD51230A30401C455c8398d06F85e4EaB6309f';
const escrowConfig = {
   recordingOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   reputationOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   exchangeOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   recordingOracleFee: BigInt('10'),
   reputationOracleFee: BigInt('10'),
   exchangeOracleFee: BigInt('10'),
   manifestUrl: 'http://localhost/manifest.json',
   manifestHash: 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079',
};
await escrowClient.setup(escrowAddress, escrowConfig);
```

***

### storeResults()

> **storeResults**(`escrowAddress`, `url`, `hash`, `txOptions?`): `Promise`\<`void`\>

Defined in: [escrow.ts:487](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L487)

This function stores the results URL and hash.

#### Parameters

##### escrowAddress

`string`

Address of the escrow.

##### url

`string`

Results file URL.

##### hash

`string`

Results file hash.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<`void`\>

Returns void if successful. Throws error if any.

**Code example**

> Only Recording Oracle or a trusted handler can call it.

```ts
import { ethers, Wallet, providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);

await escrowClient.storeResults('0x62dD51230A30401C455c8398d06F85e4EaB6309f', 'http://localhost/results.json', 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079');
```

***

### withdraw()

> **withdraw**(`escrowAddress`, `tokenAddress`, `txOptions?`): `Promise`\<[`EscrowWithdraw`](../../types/type-aliases/EscrowWithdraw.md)\>

Defined in: [escrow.ts:845](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L845)

This function withdraws additional tokens in the escrow to the canceler.

#### Parameters

##### escrowAddress

`string`

Address of the escrow to withdraw.

##### tokenAddress

`string`

Address of the token to withdraw.

##### txOptions?

`Overrides` = `{}`

Additional transaction parameters (optional, defaults to an empty object).

#### Returns

`Promise`\<[`EscrowWithdraw`](../../types/type-aliases/EscrowWithdraw.md)\>

Returns the escrow withdrawal data including transaction hash and withdrawal amount. Throws error if any.

**Code example**

> Only Job Launcher or a trusted handler can call it.

```ts
import { ethers, Wallet, providers } from 'ethers';
import { EscrowClient } from '@human-protocol/sdk';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new providers.JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);

await escrowClient.withdraw(
 '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
 '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4'
);
```

***

### build()

> `static` **build**(`runner`): `Promise`\<`EscrowClient`\>

Defined in: [escrow.ts:169](https://github.com/humanprotocol/human-protocol/blob/9da418b6962e251427442717195921599d2815f2/packages/sdk/typescript/human-protocol-sdk/src/escrow.ts#L169)

Creates an instance of EscrowClient from a Runner.

#### Parameters

##### runner

`ContractRunner`

The Runner object to interact with the Ethereum network

#### Returns

`Promise`\<`EscrowClient`\>

An instance of EscrowClient

#### Throws

Thrown if the provider does not exist for the provided Signer

#### Throws

Thrown if the network's chainId is not supported
