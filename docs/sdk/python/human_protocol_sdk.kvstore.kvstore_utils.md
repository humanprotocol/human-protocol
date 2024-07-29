# human_protocol_sdk.kvstore.kvstore_utils module

Utility class for KVStore-related operations.

## Code Example

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.kvstore import KVStoreUtils

print(
    KVStoreUtils.get_data(
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
