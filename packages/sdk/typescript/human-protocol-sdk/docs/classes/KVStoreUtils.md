Utility helpers for KVStore-related queries.

## Example

```ts
import { ChainId, KVStoreUtils } from '@human-protocol/sdk';

const kvStoreData = await KVStoreUtils.getKVStoreData(
  ChainId.POLYGON_AMOY,
  "0x1234567890123456789012345678901234567890"
);
console.log('KVStore data:', kvStoreData);
```

## Methods

### getKVStoreData()

```ts
static getKVStoreData(
   chainId: ChainId, 
   address: string, 
options?: SubgraphOptions): Promise<IKVStore[]>;
```

This function returns the KVStore data for a given address.

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the KVStore is deployed |
| `address` | `string` | Address of the KVStore |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

| Type | Description |
|------|-------------|
| `IKVStore[]` | KVStore data |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorUnsupportedChainID` | If the network's chainId is not supported |
| `ErrorInvalidAddress` | If the address is invalid |

???+ example "Example"

    ```ts
    const kvStoreData = await KVStoreUtils.getKVStoreData(
      ChainId.POLYGON_AMOY,
      "0x1234567890123456789012345678901234567890"
    );
    console.log('KVStore data:', kvStoreData);
    ```


***

### get()

```ts
static get(
   chainId: ChainId, 
   address: string, 
   key: string, 
options?: SubgraphOptions): Promise<string>;
```

Gets the value of a key-value pair in the KVStore using the subgraph.

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the KVStore is deployed |
| `address` | `string` | Address from which to get the key value. |
| `key` | `string` | Key to obtain the value. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

| Type | Description |
|------|-------------|
| `string` | Value of the key. |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorUnsupportedChainID` | If the network's chainId is not supported |
| `ErrorInvalidAddress` | If the address is invalid |
| `ErrorKVStoreEmptyKey` | If the key is empty |
| `InvalidKeyError` | If the key is not found |

???+ example "Example"

    ```ts
    const value = await KVStoreUtils.get(
      ChainId.POLYGON_AMOY,
      '0x1234567890123456789012345678901234567890',
      'role'
    );
    console.log('Value:', value);
    ```


***

### getFileUrlAndVerifyHash()

```ts
static getFileUrlAndVerifyHash(
   chainId: ChainId, 
   address: string, 
   urlKey: string, 
options?: SubgraphOptions): Promise<string>;
```

Gets the URL value of the given entity, and verifies its hash.

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `chainId` | `ChainId` | `undefined` | Network in which the KVStore is deployed |
| `address` | `string` | `undefined` | Address from which to get the URL value. |
| `urlKey` | `string` | `'url'` | Configurable URL key. `url` by default. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | `undefined` | Optional configuration for subgraph requests. |

#### Returns

| Type | Description |
|------|-------------|
| `string` | URL value for the given address if it exists, and the content is valid |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidAddress` | If the address is invalid |
| `ErrorInvalidHash` | If the hash verification fails |
| `Error` | If fetching URL or hash fails |

???+ example "Example"

    ```ts
    const url = await KVStoreUtils.getFileUrlAndVerifyHash(
      ChainId.POLYGON_AMOY,
      '0x1234567890123456789012345678901234567890'
    );
    console.log('Verified URL:', url);
    ```


***

### getPublicKey()

```ts
static getPublicKey(
   chainId: ChainId, 
   address: string, 
options?: SubgraphOptions): Promise<string>;
```

Gets the public key of the given entity, and verifies its hash.

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the KVStore is deployed |
| `address` | `string` | Address from which to get the public key. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

| Type | Description |
|------|-------------|
| `string` | Public key for the given address if it exists, and the content is valid |

#### Throws

| Type | Description |
|------|-------------|
| `ErrorInvalidAddress` | If the address is invalid |
| `ErrorInvalidHash` | If the hash verification fails |
| `Error` | If fetching the public key fails |

???+ example "Example"

    ```ts
    const publicKey = await KVStoreUtils.getPublicKey(
      ChainId.POLYGON_AMOY,
      '0x1234567890123456789012345678901234567890'
    );
    console.log('Public key:', publicKey);
    ```

