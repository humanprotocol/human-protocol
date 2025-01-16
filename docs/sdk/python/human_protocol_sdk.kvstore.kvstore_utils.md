# human_protocol_sdk.kvstore.kvstore_utils module

Utility class for KVStore-related operations.

## Code Example

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.kvstore import KVStoreUtils

print(
    KVStoreUtils.get_kvstore_data(
        ChainId.POLYGON_AMOY,
        "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65"
    )
)
```

## Module

### *class* human_protocol_sdk.kvstore.kvstore_utils.KVStoreData(key, value)

Bases: `object`

#### \_\_init_\_(key, value)

Initializes a KVStoreData instance.

* **Parameters:**
  * **key** (`str`) – Key
  * **value** (`str`) – Value

### *class* human_protocol_sdk.kvstore.kvstore_utils.KVStoreUtils

Bases: `object`

A utility class that provides additional KVStore-related functionalities.

#### *static* get(chain_id, address, key)

Gets the value of a key-value pair in the contract.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the KVStore data has been deployed
  * **address** (`str`) – The Ethereum address associated with the key-value pair
  * **key** (`str`) – The key of the key-value pair to get
* **Return type:**
  `str`
* **Returns:**
  The value of the key-value pair if it exists
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.kvstore import KVStoreUtils

  chain_id = ChainId.POLYGON_AMOY
  address = '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
  key = 'role'

  result = KVStoreUtils.get(chain_id, address, key)
  print(result)
  ```

#### *static* get_file_url_and_verify_hash(chain_id, address, key='url')

Gets the URL value of the given entity, and verify its hash.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the KVStore data has been deployed
  * **address** (`str`) – Address from which to get the URL value.
  * **key** (`Optional`[`str`]) – Configurable URL key. url by default.
* **Return url:**
  The URL value of the given address if exists, and the content is valid
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.kvstore import KVStoreUtils

  chain_id = ChainId.POLYGON_AMOY
  address = '0x62dD51230A30401C455c8398d06F85e4EaB6309f'

  url = KVStoreUtils.get_file_url_and_verify_hash(chain_id, address)
  linkedin_url = KVStoreUtils.get_file_url_and_verify_hash(chain_id, address, 'linkedin_url')
  ```
* **Return type:**
  `str`

#### *static* get_kvstore_data(chain_id, address)

Returns the KVStore data for a given address.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the KVStore data has been deployed
  * **address** (`str`) – Address of the KVStore
* **Return type:**
  `Optional`[`List`[[`KVStoreData`](#human_protocol_sdk.kvstore.kvstore_utils.KVStoreData)]]
* **Returns:**
  List of KVStore data
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.kvstore import KVStoreUtils

  print(
      KVStoreUtils.get_kvstore_data(
          ChainId.POLYGON_AMOY,
          "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65"
      )
  )
  ```

#### *static* get_public_key(chain_id, address)

Gets the public key of the given entity, and verify its hash.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the KVStore data has been deployed
  * **address** (`str`) – Address from which to get the public key.
* **Return public_key:**
  The public key of the given address if exists, and the content is valid
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.kvstore import KVStoreUtils

  chain_id = ChainId.POLYGON_AMOY
  address = '0x62dD51230A30401C455c8398d06F85e4EaB6309f'

  public_key = KVStoreUtils.get_public_key(chain_id, address)
  ```
* **Return type:**
  `str`
