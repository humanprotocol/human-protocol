Utility class for KVStore-related operations.

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

#### Throws

ErrorUnsupportedChainID If the network's chainId is not supported

#### Throws

ErrorInvalidAddress If the address is invalid

#### Example

```ts
const kvStoreData = await KVStoreUtils.getKVStoreData(
  ChainId.POLYGON_AMOY,
  "0x1234567890123456789012345678901234567890"
);
console.log('KVStore data:', kvStoreData);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the KVStore is deployed |
| `address` | `string` | Address of the KVStore |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`IKVStore`[]\>

KVStore data

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

#### Throws

ErrorUnsupportedChainID If the network's chainId is not supported

#### Throws

ErrorInvalidAddress If the address is invalid

#### Throws

ErrorKVStoreEmptyKey If the key is empty

#### Throws

InvalidKeyError If the key is not found

#### Example

```ts
const value = await KVStoreUtils.get(
  ChainId.POLYGON_AMOY,
  '0x1234567890123456789012345678901234567890',
  'role'
);
console.log('Value:', value);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the KVStore is deployed |
| `address` | `string` | Address from which to get the key value. |
| `key` | `string` | Key to obtain the value. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`string`\>

Value of the key.

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

#### Throws

ErrorInvalidAddress If the address is invalid

#### Throws

ErrorInvalidHash If the hash verification fails

#### Throws

Error If fetching URL or hash fails

#### Example

```ts
const url = await KVStoreUtils.getFileUrlAndVerifyHash(
  ChainId.POLYGON_AMOY,
  '0x1234567890123456789012345678901234567890'
);
console.log('Verified URL:', url);
```

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `chainId` | `ChainId` | `undefined` | Network in which the KVStore is deployed |
| `address` | `string` | `undefined` | Address from which to get the URL value. |
| `urlKey` | `string` | `'url'` | Configurable URL key. `url` by default. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | `undefined` | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`string`\>

URL value for the given address if it exists, and the content is valid

***

### getPublicKey()

```ts
static getPublicKey(
   chainId: ChainId, 
   address: string, 
options?: SubgraphOptions): Promise<string>;
```

Gets the public key of the given entity, and verifies its hash.

#### Throws

ErrorInvalidAddress If the address is invalid

#### Throws

ErrorInvalidHash If the hash verification fails

#### Throws

Error If fetching the public key fails

#### Example

```ts
const publicKey = await KVStoreUtils.getPublicKey(
  ChainId.POLYGON_AMOY,
  '0x1234567890123456789012345678901234567890'
);
console.log('Public key:', publicKey);
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chainId` | `ChainId` | Network in which the KVStore is deployed |
| `address` | `string` | Address from which to get the public key. |
| `options?` | [`SubgraphOptions`](../interfaces/SubgraphOptions.md) | Optional configuration for subgraph requests. |

#### Returns

`Promise`\<`string`\>

Public key for the given address if it exists, and the content is valid
