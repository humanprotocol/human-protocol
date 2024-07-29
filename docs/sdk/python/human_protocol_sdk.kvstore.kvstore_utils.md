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

#### *static* get(kvstore_contract, address, key)

Gets the value of a key-value pair in the contract.

* **Parameters:**
  * **kvstore_contract** – Contract instance
  * **address** (`str`) – The Ethereum address associated with the key-value pair
  * **key** (`str`) – The key of the key-value pair to get
* **Return type:**
  `str`
* **Returns:**
  The value of the key-value pair if it exists
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.kvstore import KVStoreUtils

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  kvstore_contract = w3.eth.contract(
      address=self.network["kvstore_address"],
      abi=kvstore_interface["abi"]
  )

  role = KVStoreUtils.get(kvstore_contract, '0x62dD51230A30401C455c8398d06F85e4EaB6309f', 'Role')
  ```

#### *static* get_file_url_and_verify_hash(kvstore_contract, address, key='url')

Gets the URL value of the given entity, and verify its hash.

* **Parameters:**
  * **kvstore_contract** – Contract instance
  * **address** (`str`) – Address from which to get the URL value.
  * **key** (`Optional`[`str`]) – Configurable URL key. url by default.
* **Return url:**
  The URL value of the given address if exists, and the content is valid
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.kvstore import KVStoreUtils

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  kvstore_contract = w3.eth.contract(
      address=self.network["kvstore_address"],
      abi=kvstore_interface["abi"]
  )

  url = KVStoreUtils.get_file_url_and_verify_hash(
      kvstore_contract,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
  )
  linkedin_url = KVStoreUtils.get_file_url_and_verify_hash(
      kvstore_contract,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
      'linkedin_url'
  )
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

#### *static* get_public_key(kvstore_contract, address)

Gets the public key of the given entity, and verify its hash.

* **Parameters:**
  * **kvstore_contract** – Contract instance
  * **address** (`str`) – Address from which to get the public key.
* **Return public_key:**
  The public key of the given address if exists, and the content is valid
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.kvstore import KVStoreUtils

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  kvstore_contract = w3.eth.contract(
      address=self.network["kvstore_address"],
      abi=kvstore_interface["abi"]
  )

  public_key = KVStoreUtils.get_public_key(
      kvstore_contract,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
  )
  ```
* **Return type:**
  `str`
