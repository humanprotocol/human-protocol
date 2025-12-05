This client enables performing actions on Escrow contracts and obtaining information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the `runner`.
To use this client, it is recommended to initialize it using the static [`build`](/ts/classes/EscrowClient/#build) method.

A `Signer` or a `Provider` should be passed depending on the use case of this module:

- **Signer**: when the user wants to use this model to send transactions calling the contract functions.
- **Provider**: when the user wants to use this model to get information from the contracts or subgraph.

## Example

###Using Signer

####Using private key (backend)

```ts
import { EscrowClient } from '@human-protocol/sdk';
import { Wallet, JsonRpcProvider } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const privateKey = 'YOUR_PRIVATE_KEY';

const provider = new JsonRpcProvider(rpcUrl);
const signer = new Wallet(privateKey, provider);
const escrowClient = await EscrowClient.build(signer);
```

####Using Wagmi (frontend)

```ts
import { useSigner } from 'wagmi';
import { EscrowClient } from '@human-protocol/sdk';

const { data: signer } = useSigner();
const escrowClient = await EscrowClient.build(signer);
```

###Using Provider

```ts
import { EscrowClient } from '@human-protocol/sdk';
import { JsonRpcProvider } from 'ethers';

const rpcUrl = 'YOUR_RPC_URL';
const provider = new JsonRpcProvider(rpcUrl);
const escrowClient = await EscrowClient.build(provider);
```

## Extends

- `BaseEthersClient`

## Constructors

### Constructor

```ts
new EscrowClient(runner: ContractRunner, networkData: NetworkData): EscrowClient;
```

**EscrowClient constructor**

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |
| `networkData` | [`NetworkData`](../type-aliases/NetworkData.md) | The network information required to connect to the Escrow contract |

#### Returns

`EscrowClient`

#### Overrides

```ts
BaseEthersClient.constructor
```

## Methods

### build()

```ts
static build(runner: ContractRunner): Promise<EscrowClient>;
```

Creates an instance of EscrowClient from a Runner.

#### Throws

ErrorProviderDoesNotExist If the provider does not exist for the provided Signer

#### Throws

ErrorUnsupportedChainID If the network's chainId is not supported

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |

#### Returns

`Promise`\<`EscrowClient`\>

An instance of EscrowClient

***

### createEscrow()

```ts
createEscrow(
   tokenAddress: string, 
   jobRequesterId: string, 
txOptions: Overrides): Promise<string>;
```

This function creates an escrow contract that uses the token passed to pay oracle fees and reward workers.

#### Throws

ErrorInvalidTokenAddress If the token address is invalid

#### Throws

ErrorLaunchedEventIsNotEmitted If the LaunchedV2 event is not emitted

#### Example

> Need to have available stake.

```ts
const tokenAddress = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4';
const jobRequesterId = "job-requester-id";
const escrowAddress = await escrowClient.createEscrow(tokenAddress, jobRequesterId);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokenAddress` | `string` | The address of the token to use for escrow funding. |
| `jobRequesterId` | `string` | Identifier for the job requester. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`string`\>

Returns the address of the escrow created.

***

### createFundAndSetupEscrow()

```ts
createFundAndSetupEscrow(
   tokenAddress: string, 
   amount: bigint, 
   jobRequesterId: string, 
   escrowConfig: IEscrowConfig, 
txOptions: Overrides): Promise<string>;
```

Creates, funds, and sets up a new escrow contract in a single transaction.

#### Throws

ErrorInvalidTokenAddress If the token address is invalid

#### Throws

ErrorInvalidRecordingOracleAddressProvided If the recording oracle address is invalid

#### Throws

ErrorInvalidReputationOracleAddressProvided If the reputation oracle address is invalid

#### Throws

ErrorInvalidExchangeOracleAddressProvided If the exchange oracle address is invalid

#### Throws

ErrorAmountMustBeGreaterThanZero If any oracle fee is less than or equal to zero

#### Throws

ErrorTotalFeeMustBeLessThanHundred If the total oracle fees exceed 100

#### Throws

ErrorInvalidManifest If the manifest is not a valid URL or JSON string

#### Throws

ErrorHashIsEmptyString If the manifest hash is empty

#### Throws

ErrorLaunchedEventIsNotEmitted If the LaunchedV2 event is not emitted

#### Example

```ts
import { ethers } from 'ethers';
import { ERC20__factory } from '@human-protocol/sdk';

const tokenAddress = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4';
const amount = ethers.parseUnits('1000', 18);
const jobRequesterId = 'requester-123';

const token = ERC20__factory.connect(tokenAddress, signer);
await token.approve(escrowClient.escrowFactoryContract.target, amount);

const escrowConfig = {
  recordingOracle: '0xRecordingOracleAddress',
  reputationOracle: '0xReputationOracleAddress',
  exchangeOracle: '0xExchangeOracleAddress',
  recordingOracleFee: 5n,
  reputationOracleFee: 5n,
  exchangeOracleFee: 5n,
  manifest: 'https://example.com/manifest.json',
  manifestHash: 'manifestHash-123',
};

const escrowAddress = await escrowClient.createFundAndSetupEscrow(
  tokenAddress,
  amount,
  jobRequesterId,
  escrowConfig
);
console.log('Escrow created at:', escrowAddress);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokenAddress` | `string` | The ERC-20 token address used to fund the escrow. |
| `amount` | `bigint` | The token amount to fund the escrow with. |
| `jobRequesterId` | `string` | An off-chain identifier for the job requester. |
| `escrowConfig` | `IEscrowConfig` | Configuration parameters for escrow setup. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`string`\>

Returns the address of the escrow created.

***

### setup()

```ts
setup(
   escrowAddress: string, 
   escrowConfig: IEscrowConfig, 
txOptions: Overrides): Promise<void>;
```

This function sets up the parameters of the escrow.

#### Throws

ErrorInvalidRecordingOracleAddressProvided If the recording oracle address is invalid

#### Throws

ErrorInvalidReputationOracleAddressProvided If the reputation oracle address is invalid

#### Throws

ErrorInvalidExchangeOracleAddressProvided If the exchange oracle address is invalid

#### Throws

ErrorAmountMustBeGreaterThanZero If any oracle fee is less than or equal to zero

#### Throws

ErrorTotalFeeMustBeLessThanHundred If the total oracle fees exceed 100

#### Throws

ErrorInvalidManifest If the manifest is not a valid URL or JSON string

#### Throws

ErrorHashIsEmptyString If the manifest hash is empty

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

> Only Job Launcher or admin can call it.

```ts
const escrowAddress = '0x62dD51230A30401C455c8398d06F85e4EaB6309f';
const escrowConfig = {
   recordingOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   reputationOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   exchangeOracle: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
   recordingOracleFee: 10n,
   reputationOracleFee: 10n,
   exchangeOracleFee: 10n,
   manifest: 'http://localhost/manifest.json',
   manifestHash: 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079',
};
await escrowClient.setup(escrowAddress, escrowConfig);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow to set up. |
| `escrowConfig` | `IEscrowConfig` | Escrow configuration parameters. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### fund()

```ts
fund(
   escrowAddress: string, 
   amount: bigint, 
txOptions: Overrides): Promise<void>;
```

This function adds funds of the chosen token to the escrow.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorAmountMustBeGreaterThanZero If the amount is less than or equal to zero

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
import { ethers } from 'ethers';

const amount = ethers.parseUnits('5', 'ether');
await escrowClient.fund('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow to fund. |
| `amount` | `bigint` | Amount to be added as funds. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### storeResults()

#### Call Signature

```ts
storeResults(
   escrowAddress: string, 
   url: string, 
   hash: string, 
   fundsToReserve: bigint, 
txOptions?: Overrides): Promise<void>;
```

This function stores the results URL and hash.

##### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

##### Throws

ErrorInvalidUrl If the URL is invalid

##### Throws

ErrorHashIsEmptyString If the hash is empty

##### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

##### Throws

ErrorStoreResultsVersion If using deprecated signature

##### Example

> Only Recording Oracle or admin can call it.

```ts
import { ethers } from 'ethers';

await escrowClient.storeResults(
  '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
  'http://localhost/results.json',
  'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079',
  ethers.parseEther('10')
);
```

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |
| `url` | `string` | Results file URL. |
| `hash` | `string` | Results file hash. |
| `fundsToReserve` | `bigint` | Funds to reserve for payouts |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

##### Returns

`Promise`\<`void`\>

#### Call Signature

```ts
storeResults(
   escrowAddress: string, 
   url: string, 
   hash: string, 
txOptions?: Overrides): Promise<void>;
```

This function stores the results URL and hash.

##### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

##### Throws

ErrorInvalidUrl If the URL is invalid

##### Throws

ErrorHashIsEmptyString If the hash is empty

##### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

##### Throws

ErrorStoreResultsVersion If using deprecated signature

##### Example

> Only Recording Oracle or admin can call it.

```ts
await escrowClient.storeResults(
  '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
  'http://localhost/results.json',
  'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079'
);
```

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |
| `url` | `string` | Results file URL. |
| `hash` | `string` | Results file hash. |
| `txOptions?` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

##### Returns

`Promise`\<`void`\>

***

### complete()

```ts
complete(escrowAddress: string, txOptions: Overrides): Promise<void>;
```

This function sets the status of an escrow to completed.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

> Only Recording Oracle or admin can call it.

```ts
await escrowClient.complete('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### bulkPayOut()

#### Call Signature

```ts
bulkPayOut(
   escrowAddress: string, 
   recipients: string[], 
   amounts: bigint[], 
   finalResultsUrl: string, 
   finalResultsHash: string, 
   txId: number, 
   forceComplete: boolean, 
txOptions: Overrides): Promise<void>;
```

This function pays out the amounts specified to the workers and sets the URL of the final results file.

##### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

##### Throws

ErrorRecipientCannotBeEmptyArray If the recipients array is empty

##### Throws

ErrorTooManyRecipients If there are too many recipients

##### Throws

ErrorAmountsCannotBeEmptyArray If the amounts array is empty

##### Throws

ErrorRecipientAndAmountsMustBeSameLength If recipients and amounts arrays have different lengths

##### Throws

InvalidEthereumAddressError If any recipient address is invalid

##### Throws

ErrorInvalidUrl If the final results URL is invalid

##### Throws

ErrorHashIsEmptyString If the final results hash is empty

##### Throws

ErrorEscrowDoesNotHaveEnoughBalance If the escrow doesn't have enough balance

##### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

##### Throws

ErrorBulkPayOutVersion If using deprecated signature

##### Example

> Only Reputation Oracle or admin can call it.

```ts
import { ethers } from 'ethers';

const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
const amounts = [ethers.parseUnits('5', 'ether'), ethers.parseUnits('10', 'ether')];
const resultsUrl = 'http://localhost/results.json';
const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
const txId = 1;

await escrowClient.bulkPayOut(
  '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
  recipients,
  amounts,
  resultsUrl,
  resultsHash,
  txId,
  true
);
```

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Escrow address to payout. |
| `recipients` | `string`[] | Array of recipient addresses. |
| `amounts` | `bigint`[] | Array of amounts the recipients will receive. |
| `finalResultsUrl` | `string` | Final results file URL. |
| `finalResultsHash` | `string` | Final results file hash. |
| `txId` | `number` | Transaction ID. |
| `forceComplete` | `boolean` | Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false). |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

##### Returns

`Promise`\<`void`\>

#### Call Signature

```ts
bulkPayOut(
   escrowAddress: string, 
   recipients: string[], 
   amounts: bigint[], 
   finalResultsUrl: string, 
   finalResultsHash: string, 
   payoutId: string, 
   forceComplete: boolean, 
txOptions: Overrides): Promise<void>;
```

This function pays out the amounts specified to the workers and sets the URL of the final results file.

##### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

##### Throws

ErrorRecipientCannotBeEmptyArray If the recipients array is empty

##### Throws

ErrorTooManyRecipients If there are too many recipients

##### Throws

ErrorAmountsCannotBeEmptyArray If the amounts array is empty

##### Throws

ErrorRecipientAndAmountsMustBeSameLength If recipients and amounts arrays have different lengths

##### Throws

InvalidEthereumAddressError If any recipient address is invalid

##### Throws

ErrorInvalidUrl If the final results URL is invalid

##### Throws

ErrorHashIsEmptyString If the final results hash is empty

##### Throws

ErrorEscrowDoesNotHaveEnoughBalance If the escrow doesn't have enough balance

##### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

##### Throws

ErrorBulkPayOutVersion If using deprecated signature

##### Example

> Only Reputation Oracle or admin can call it.

```ts
import { ethers } from 'ethers';
import { v4 as uuidV4 } from 'uuid';

const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
const amounts = [ethers.parseUnits('5', 'ether'), ethers.parseUnits('10', 'ether')];
const resultsUrl = 'http://localhost/results.json';
const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
const payoutId = uuidV4();

await escrowClient.bulkPayOut(
  '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
  recipients,
  amounts,
  resultsUrl,
  resultsHash,
  payoutId,
  true
);
```

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Escrow address to payout. |
| `recipients` | `string`[] | Array of recipient addresses. |
| `amounts` | `bigint`[] | Array of amounts the recipients will receive. |
| `finalResultsUrl` | `string` | Final results file URL. |
| `finalResultsHash` | `string` | Final results file hash. |
| `payoutId` | `string` | Payout ID. |
| `forceComplete` | `boolean` | Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false). |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

##### Returns

`Promise`\<`void`\>

***

### cancel()

```ts
cancel(escrowAddress: string, txOptions: Overrides): Promise<void>;
```

This function cancels the specified escrow and sends the balance to the canceler.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

> Only Job Launcher or admin can call it.

```ts
await escrowClient.cancel('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow to cancel. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### requestCancellation()

```ts
requestCancellation(escrowAddress: string, txOptions: Overrides): Promise<void>;
```

This function requests the cancellation of the specified escrow (moves status to ToCancel or finalizes if expired).

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

> Only Job Launcher or admin can call it.

```ts
await escrowClient.requestCancellation('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow to request cancellation. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`void`\>

***

### withdraw()

```ts
withdraw(
   escrowAddress: string, 
   tokenAddress: string, 
txOptions: Overrides): Promise<IEscrowWithdraw>;
```

This function withdraws additional tokens in the escrow to the canceler.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorInvalidTokenAddress If the token address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Throws

ErrorTransferEventNotFoundInTransactionLogs If the Transfer event is not found in transaction logs

#### Example

> Only Job Launcher or admin can call it.

```ts
const withdrawData = await escrowClient.withdraw(
 '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
 '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4'
);
console.log('Withdrawn amount:', withdrawData.withdrawnAmount);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow to withdraw. |
| `tokenAddress` | `string` | Address of the token to withdraw. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`IEscrowWithdraw`\>

Returns the escrow withdrawal data including transaction hash and withdrawal amount.

***

### createBulkPayoutTransaction()

```ts
createBulkPayoutTransaction(
   escrowAddress: string, 
   recipients: string[], 
   amounts: bigint[], 
   finalResultsUrl: string, 
   finalResultsHash: string, 
   payoutId: string, 
   forceComplete: boolean, 
txOptions: Overrides): Promise<TransactionLikeWithNonce>;
```

Creates a prepared transaction for bulk payout without immediately sending it.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorRecipientCannotBeEmptyArray If the recipients array is empty

#### Throws

ErrorTooManyRecipients If there are too many recipients

#### Throws

ErrorAmountsCannotBeEmptyArray If the amounts array is empty

#### Throws

ErrorRecipientAndAmountsMustBeSameLength If recipients and amounts arrays have different lengths

#### Throws

InvalidEthereumAddressError If any recipient address is invalid

#### Throws

ErrorInvalidUrl If the final results URL is invalid

#### Throws

ErrorHashIsEmptyString If the final results hash is empty

#### Throws

ErrorEscrowDoesNotHaveEnoughBalance If the escrow doesn't have enough balance

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

> Only Reputation Oracle or admin can call it.

```ts
import { ethers } from 'ethers';
import { v4 as uuidV4 } from 'uuid';

const recipients = ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];
const amounts = [ethers.parseUnits('5', 'ether'), ethers.parseUnits('10', 'ether')];
const resultsUrl = 'http://localhost/results.json';
const resultsHash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079';
const payoutId = uuidV4();

const rawTransaction = await escrowClient.createBulkPayoutTransaction(
  '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
  recipients,
  amounts,
  resultsUrl,
  resultsHash,
  payoutId
);
console.log('Raw transaction:', rawTransaction);

const signedTransaction = await signer.signTransaction(rawTransaction);
console.log('Tx hash:', ethers.keccak256(signedTransaction));
await signer.sendTransaction(rawTransaction);
```

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `escrowAddress` | `string` | `undefined` | Escrow address to payout. |
| `recipients` | `string`[] | `undefined` | Array of recipient addresses. |
| `amounts` | `bigint`[] | `undefined` | Array of amounts the recipients will receive. |
| `finalResultsUrl` | `string` | `undefined` | Final results file URL. |
| `finalResultsHash` | `string` | `undefined` | Final results file hash. |
| `payoutId` | `string` | `undefined` | Payout ID to identify the payout. |
| `forceComplete` | `boolean` | `false` | Indicates if remaining balance should be transferred to the escrow creator (optional, defaults to false). |
| `txOptions` | `Overrides` | `{}` | Additional transaction parameters (optional, defaults to an empty object). |

#### Returns

`Promise`\<`TransactionLikeWithNonce`\>

Returns object with raw transaction and nonce

***

### getBalance()

```ts
getBalance(escrowAddress: string): Promise<bigint>;
```

This function returns the balance for a specified escrow address.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const balance = await escrowClient.getBalance('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Balance:', balance);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`bigint`\>

Balance of the escrow in the token used to fund it.

***

### getReservedFunds()

```ts
getReservedFunds(escrowAddress: string): Promise<bigint>;
```

This function returns the reserved funds for a specified escrow address.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const reservedFunds = await escrowClient.getReservedFunds('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Reserved funds:', reservedFunds);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`bigint`\>

Reserved funds of the escrow in the token used to fund it.

***

### getManifestHash()

```ts
getManifestHash(escrowAddress: string): Promise<string>;
```

This function returns the manifest file hash.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const manifestHash = await escrowClient.getManifestHash('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Manifest hash:', manifestHash);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

Hash of the manifest file content.

***

### getManifest()

```ts
getManifest(escrowAddress: string): Promise<string>;
```

This function returns the manifest. Could be a URL or a JSON string.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const manifest = await escrowClient.getManifest('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Manifest:', manifest);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

Manifest URL or JSON string.

***

### getResultsUrl()

```ts
getResultsUrl(escrowAddress: string): Promise<string>;
```

This function returns the results file URL.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const resultsUrl = await escrowClient.getResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Results URL:', resultsUrl);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

Results file URL.

***

### getIntermediateResultsUrl()

```ts
getIntermediateResultsUrl(escrowAddress: string): Promise<string>;
```

This function returns the intermediate results file URL.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const intermediateResultsUrl = await escrowClient.getIntermediateResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Intermediate results URL:', intermediateResultsUrl);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

URL of the file that stores results from Recording Oracle.

***

### getIntermediateResultsHash()

```ts
getIntermediateResultsHash(escrowAddress: string): Promise<string>;
```

This function returns the intermediate results hash.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const intermediateResultsHash = await escrowClient.getIntermediateResultsHash('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Intermediate results hash:', intermediateResultsHash);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

Hash of the intermediate results file content.

***

### getTokenAddress()

```ts
getTokenAddress(escrowAddress: string): Promise<string>;
```

This function returns the token address used for funding the escrow.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const tokenAddress = await escrowClient.getTokenAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Token address:', tokenAddress);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

Address of the token used to fund the escrow.

***

### getStatus()

```ts
getStatus(escrowAddress: string): Promise<EscrowStatus>;
```

This function returns the current status of the escrow.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
import { EscrowStatus } from '@human-protocol/sdk';

const status = await escrowClient.getStatus('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Status:', EscrowStatus[status]);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<[`EscrowStatus`](../enumerations/EscrowStatus.md)\>

Current status of the escrow.

***

### getRecordingOracleAddress()

```ts
getRecordingOracleAddress(escrowAddress: string): Promise<string>;
```

This function returns the recording oracle address for a given escrow.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const oracleAddress = await escrowClient.getRecordingOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Recording Oracle address:', oracleAddress);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

Address of the Recording Oracle.

***

### getJobLauncherAddress()

```ts
getJobLauncherAddress(escrowAddress: string): Promise<string>;
```

This function returns the job launcher address for a given escrow.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const jobLauncherAddress = await escrowClient.getJobLauncherAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Job Launcher address:', jobLauncherAddress);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

Address of the Job Launcher.

***

### getReputationOracleAddress()

```ts
getReputationOracleAddress(escrowAddress: string): Promise<string>;
```

This function returns the reputation oracle address for a given escrow.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const oracleAddress = await escrowClient.getReputationOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Reputation Oracle address:', oracleAddress);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

Address of the Reputation Oracle.

***

### getExchangeOracleAddress()

```ts
getExchangeOracleAddress(escrowAddress: string): Promise<string>;
```

This function returns the exchange oracle address for a given escrow.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const oracleAddress = await escrowClient.getExchangeOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Exchange Oracle address:', oracleAddress);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

Address of the Exchange Oracle.

***

### getFactoryAddress()

```ts
getFactoryAddress(escrowAddress: string): Promise<string>;
```

This function returns the escrow factory address for a given escrow.

#### Throws

ErrorInvalidEscrowAddressProvided If the escrow address is invalid

#### Throws

ErrorEscrowAddressIsNotProvidedByFactory If the escrow is not provided by the factory

#### Example

```ts
const factoryAddress = await escrowClient.getFactoryAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
console.log('Factory address:', factoryAddress);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |

#### Returns

`Promise`\<`string`\>

Address of the escrow factory.
