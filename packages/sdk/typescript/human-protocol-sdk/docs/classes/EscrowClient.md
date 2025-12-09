Client to perform actions on Escrow contracts and obtain information from the contracts.

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

| Type | Description |
|------|-------------|
| `EscrowClient` | An instance of EscrowClient |

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

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `runner` | `ContractRunner` | The Runner object to interact with the Ethereum network |


#### Returns

| Type | Description |
|------|-------------|
| `EscrowClient` | An instance of EscrowClient |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorProviderDoesNotExist` | If the provider does not exist for the provided Signer |
| `ErrorUnsupportedChainID` | If the network's chainId is not supported |

***

### createEscrow()

```ts
createEscrow(
   tokenAddress: string, 
   jobRequesterId: string, 
txOptions: Overrides): Promise<string>;
```

This function creates an escrow contract that uses the token passed to pay oracle fees and reward workers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokenAddress` | `string` | The address of the token to use for escrow funding. |
| `jobRequesterId` | `string` | Identifier for the job requester. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Returns the address of the escrow created. |

#### Remarks

Need to have available stake.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidTokenAddress` | If the token address is invalid |
| `ErrorLaunchedEventIsNotEmitted` | If the LaunchedV2 event is not emitted |

???+ example "Example"

    ```ts
    const tokenAddress = '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4';
    const jobRequesterId = "job-requester-id";
    const escrowAddress = await escrowClient.createEscrow(tokenAddress, jobRequesterId);
    ```


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

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokenAddress` | `string` | The ERC-20 token address used to fund the escrow. |
| `amount` | `bigint` | The token amount to fund the escrow with. |
| `jobRequesterId` | `string` | An off-chain identifier for the job requester. |
| `escrowConfig` | `IEscrowConfig` | Configuration parameters for escrow setup. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Returns the address of the escrow created. |

#### Remarks

Need to have available stake and approve allowance in the token contract before calling this method.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidTokenAddress` | If the token address is invalid |
| `ErrorInvalidRecordingOracleAddressProvided` | If the recording oracle address is invalid |
| `ErrorInvalidReputationOracleAddressProvided` | If the reputation oracle address is invalid |
| `ErrorInvalidExchangeOracleAddressProvided` | If the exchange oracle address is invalid |
| `ErrorAmountMustBeGreaterThanZero` | If any oracle fee is less than or equal to zero |
| `ErrorTotalFeeMustBeLessThanHundred` | If the total oracle fees exceed 100 |
| `ErrorInvalidManifest` | If the manifest is not a valid URL or JSON string |
| `ErrorHashIsEmptyString` | If the manifest hash is empty |
| `ErrorLaunchedEventIsNotEmitted` | If the LaunchedV2 event is not emitted |

???+ example "Example"

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


***

### setup()

```ts
setup(
   escrowAddress: string, 
   escrowConfig: IEscrowConfig, 
txOptions: Overrides): Promise<void>;
```

This function sets up the parameters of the escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow to set up. |
| `escrowConfig` | `IEscrowConfig` | Escrow configuration parameters. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Remarks

Only Job Launcher or admin can call it.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidRecordingOracleAddressProvided` | If the recording oracle address is invalid |
| `ErrorInvalidReputationOracleAddressProvided` | If the reputation oracle address is invalid |
| `ErrorInvalidExchangeOracleAddressProvided` | If the exchange oracle address is invalid |
| `ErrorAmountMustBeGreaterThanZero` | If any oracle fee is less than or equal to zero |
| `ErrorTotalFeeMustBeLessThanHundred` | If the total oracle fees exceed 100 |
| `ErrorInvalidManifest` | If the manifest is not a valid URL or JSON string |
| `ErrorHashIsEmptyString` | If the manifest hash is empty |
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

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


***

### fund()

```ts
fund(
   escrowAddress: string, 
   amount: bigint, 
txOptions: Overrides): Promise<void>;
```

This function adds funds of the chosen token to the escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow to fund. |
| `amount` | `bigint` | Amount to be added as funds. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorAmountMustBeGreaterThanZero` | If the amount is less than or equal to zero |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    import { ethers } from 'ethers';
    
    const amount = ethers.parseUnits('5', 'ether');
    await escrowClient.fund('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount);
    ```


***

### storeResults()

#### Call Signature

```ts
storeResults(
   escrowAddress: string, 
   url: string, 
   hash: string, 
txOptions?: Overrides): Promise<void>;
```

Stores the result URL and result hash for an escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | The escrow address. |
| `url` | `string` | The URL containing the final results. May be empty only when `fundsToReserve` is `0n`. |
| `hash` | `string` | The hash of the results payload. |
| `txOptions?` | `Overrides` | Optional transaction overrides. |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Remarks

Only Recording Oracle or admin can call it.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the provided escrow address is invalid. |
| `ErrorInvalidUrl` | If the URL format is invalid. |
| `ErrorHashIsEmptyString` | If the hash is empty and empty values are not allowed. |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow does not exist in the factory. |
| `ErrorStoreResultsVersion` | If the contract supports only the deprecated signature. |

???+ example "Example"

    ```ts
    await escrowClient.storeResults(
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
      'https://example.com/results.json',
      '0xHASH123'
    );
    ```


#### Call Signature

```ts
storeResults(
   escrowAddress: string, 
   url: string, 
   hash: string, 
   fundsToReserve: bigint, 
txOptions?: Overrides): Promise<void>;
```

Stores the result URL and result hash for an escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | The escrow address. |
| `url` | `string` | The URL containing the final results. May be empty only when `fundsToReserve` is `0n`. |
| `hash` | `string` | The hash of the results payload. |
| `fundsToReserve` | `bigint` | Optional amount of funds to reserve (when using second overload). |
| `txOptions?` | `Overrides` | Optional transaction overrides. |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Remarks

Only Recording Oracle or admin can call it.

If `fundsToReserve` is provided, the escrow reserves the specified funds.
When `fundsToReserve` is `0n`, an empty URL is allowed (for cases where no solutions were provided).

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the provided escrow address is invalid. |
| `ErrorInvalidUrl` | If the URL format is invalid. |
| `ErrorHashIsEmptyString` | If the hash is empty and empty values are not allowed. |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow does not exist in the factory. |
| `ErrorStoreResultsVersion` | If the contract supports only the deprecated signature. |

???+ example "Example"

    ```ts
    import { ethers } from 'ethers';
    
    await escrowClient.storeResults(
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
      'https://example.com/results.json',
      '0xHASH123',
      ethers.parseEther('5')
    );
    ```


***

### complete()

```ts
complete(escrowAddress: string, txOptions: Overrides): Promise<void>;
```

This function sets the status of an escrow to completed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Remarks

Only Recording Oracle or admin can call it.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid. |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory. |

???+ example "Example"

    ```ts
    await escrowClient.complete('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    ```


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

#### Parameters

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


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Remarks

Only Reputation Oracle or admin can call it.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorRecipientCannotBeEmptyArray` | If the recipients array is empty |
| `ErrorTooManyRecipients` | If there are too many recipients |
| `ErrorAmountsCannotBeEmptyArray` | If the amounts array is empty |
| `ErrorRecipientAndAmountsMustBeSameLength` | If recipients and amounts arrays have different lengths |
| `InvalidEthereumAddressError` | If any recipient address is invalid |
| `ErrorInvalidUrl` | If the final results URL is invalid |
| `ErrorHashIsEmptyString` | If the final results hash is empty |
| `ErrorEscrowDoesNotHaveEnoughBalance` | If the escrow doesn't have enough balance |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |
| `ErrorBulkPayOutVersion` | If using deprecated signature |

???+ example "Example"

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

#### Parameters

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


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Remarks

Only Reputation Oracle or admin can call it.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorRecipientCannotBeEmptyArray` | If the recipients array is empty |
| `ErrorTooManyRecipients` | If there are too many recipients |
| `ErrorAmountsCannotBeEmptyArray` | If the amounts array is empty |
| `ErrorRecipientAndAmountsMustBeSameLength` | If recipients and amounts arrays have different lengths |
| `InvalidEthereumAddressError` | If any recipient address is invalid |
| `ErrorInvalidUrl` | If the final results URL is invalid |
| `ErrorHashIsEmptyString` | If the final results hash is empty |
| `ErrorEscrowDoesNotHaveEnoughBalance` | If the escrow doesn't have enough balance |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |
| `ErrorBulkPayOutVersion` | If using deprecated signature |

???+ example "Example"

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


***

### cancel()

```ts
cancel(escrowAddress: string, txOptions: Overrides): Promise<void>;
```

This function cancels the specified escrow and sends the balance to the canceler.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow to cancel. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Remarks

Only Job Launcher or admin can call it.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    await escrowClient.cancel('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    ```


***

### requestCancellation()

```ts
requestCancellation(escrowAddress: string, txOptions: Overrides): Promise<void>;
```

This function requests the cancellation of the specified escrow (moves status to ToCancel or finalizes if expired).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow to request cancellation. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `void` | - |

#### Remarks

Only Job Launcher or admin can call it.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    await escrowClient.requestCancellation('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    ```


***

### withdraw()

```ts
withdraw(
   escrowAddress: string, 
   tokenAddress: string, 
txOptions: Overrides): Promise<IEscrowWithdraw>;
```

This function withdraws additional tokens in the escrow to the canceler.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow to withdraw. |
| `tokenAddress` | `string` | Address of the token to withdraw. |
| `txOptions` | `Overrides` | Additional transaction parameters (optional, defaults to an empty object). |


#### Returns

| Type | Description |
|------|-------------|
| `IEscrowWithdraw` | Returns the escrow withdrawal data including transaction hash and withdrawal amount. |

#### Remarks

Only Job Launcher or admin can call it.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorInvalidTokenAddress` | If the token address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |
| `ErrorTransferEventNotFoundInTransactionLogs` | If the Transfer event is not found in transaction logs |

???+ example "Example"

    ```ts
    const withdrawData = await escrowClient.withdraw(
     '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
     '0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4'
    );
    console.log('Withdrawn amount:', withdrawData.withdrawnAmount);
    ```


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

| Type | Description |
|------|-------------|
| `TransactionLikeWithNonce` | Returns object with raw transaction and nonce |

#### Remarks

Only Reputation Oracle or admin can call it.

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorRecipientCannotBeEmptyArray` | If the recipients array is empty |
| `ErrorTooManyRecipients` | If there are too many recipients |
| `ErrorAmountsCannotBeEmptyArray` | If the amounts array is empty |
| `ErrorRecipientAndAmountsMustBeSameLength` | If recipients and amounts arrays have different lengths |
| `InvalidEthereumAddressError` | If any recipient address is invalid |
| `ErrorInvalidUrl` | If the final results URL is invalid |
| `ErrorHashIsEmptyString` | If the final results hash is empty |
| `ErrorEscrowDoesNotHaveEnoughBalance` | If the escrow doesn't have enough balance |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

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


***

### getBalance()

```ts
getBalance(escrowAddress: string): Promise<bigint>;
```

This function returns the balance for a specified escrow address.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `bigint` | Balance of the escrow in the token used to fund it. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const balance = await escrowClient.getBalance('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Balance:', balance);
    ```


***

### getReservedFunds()

```ts
getReservedFunds(escrowAddress: string): Promise<bigint>;
```

This function returns the reserved funds for a specified escrow address.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `bigint` | Reserved funds of the escrow in the token used to fund it. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const reservedFunds = await escrowClient.getReservedFunds('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Reserved funds:', reservedFunds);
    ```


***

### getManifestHash()

```ts
getManifestHash(escrowAddress: string): Promise<string>;
```

This function returns the manifest file hash.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Hash of the manifest file content. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const manifestHash = await escrowClient.getManifestHash('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Manifest hash:', manifestHash);
    ```


***

### getManifest()

```ts
getManifest(escrowAddress: string): Promise<string>;
```

This function returns the manifest. Could be a URL or a JSON string.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Manifest URL or JSON string. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const manifest = await escrowClient.getManifest('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Manifest:', manifest);
    ```


***

### getResultsUrl()

```ts
getResultsUrl(escrowAddress: string): Promise<string>;
```

This function returns the results file URL.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Results file URL. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const resultsUrl = await escrowClient.getResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Results URL:', resultsUrl);
    ```


***

### getIntermediateResultsUrl()

```ts
getIntermediateResultsUrl(escrowAddress: string): Promise<string>;
```

This function returns the intermediate results file URL.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | URL of the file that stores results from Recording Oracle. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const intermediateResultsUrl = await escrowClient.getIntermediateResultsUrl('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Intermediate results URL:', intermediateResultsUrl);
    ```


***

### getIntermediateResultsHash()

```ts
getIntermediateResultsHash(escrowAddress: string): Promise<string>;
```

This function returns the intermediate results hash.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Hash of the intermediate results file content. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const intermediateResultsHash = await escrowClient.getIntermediateResultsHash('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Intermediate results hash:', intermediateResultsHash);
    ```


***

### getTokenAddress()

```ts
getTokenAddress(escrowAddress: string): Promise<string>;
```

This function returns the token address used for funding the escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Address of the token used to fund the escrow. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const tokenAddress = await escrowClient.getTokenAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Token address:', tokenAddress);
    ```


***

### getStatus()

```ts
getStatus(escrowAddress: string): Promise<EscrowStatus>;
```

This function returns the current status of the escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `[EscrowStatus](../enumerations/EscrowStatus.md)` | Current status of the escrow. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    import { EscrowStatus } from '@human-protocol/sdk';
    
    const status = await escrowClient.getStatus('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Status:', EscrowStatus[status]);
    ```


***

### getRecordingOracleAddress()

```ts
getRecordingOracleAddress(escrowAddress: string): Promise<string>;
```

This function returns the recording oracle address for a given escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Address of the Recording Oracle. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const oracleAddress = await escrowClient.getRecordingOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Recording Oracle address:', oracleAddress);
    ```


***

### getJobLauncherAddress()

```ts
getJobLauncherAddress(escrowAddress: string): Promise<string>;
```

This function returns the job launcher address for a given escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Address of the Job Launcher. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const jobLauncherAddress = await escrowClient.getJobLauncherAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Job Launcher address:', jobLauncherAddress);
    ```


***

### getReputationOracleAddress()

```ts
getReputationOracleAddress(escrowAddress: string): Promise<string>;
```

This function returns the reputation oracle address for a given escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Address of the Reputation Oracle. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const oracleAddress = await escrowClient.getReputationOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Reputation Oracle address:', oracleAddress);
    ```


***

### getExchangeOracleAddress()

```ts
getExchangeOracleAddress(escrowAddress: string): Promise<string>;
```

This function returns the exchange oracle address for a given escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Address of the Exchange Oracle. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const oracleAddress = await escrowClient.getExchangeOracleAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Exchange Oracle address:', oracleAddress);
    ```


***

### getFactoryAddress()

```ts
getFactoryAddress(escrowAddress: string): Promise<string>;
```

This function returns the escrow factory address for a given escrow.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `escrowAddress` | `string` | Address of the escrow. |


#### Returns

| Type | Description |
|------|-------------|
| `string` | Address of the escrow factory. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidEscrowAddressProvided` | If the escrow address is invalid |
| `ErrorEscrowAddressIsNotProvidedByFactory` | If the escrow is not provided by the factory |

???+ example "Example"

    ```ts
    const factoryAddress = await escrowClient.getFactoryAddress('0x62dD51230A30401C455c8398d06F85e4EaB6309f');
    console.log('Factory address:', factoryAddress);
    ```

