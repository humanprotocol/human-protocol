# human_protocol_sdk.kvstore.kvstore_client module

This client enables performing actions on the KVStore contract and
obtaining information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the web3.
To use this client, you need to create a Web3 instance and configure the default account,
as well as some middlewares.

## Code Example

* With Signer

```python
from eth_typing import URI
from web3 import Web3
from web3.middleware import SignAndSendRawMiddlewareBuilder
from web3.providers.auto import load_provider_from_uri

from human_protocol_sdk.kvstore import KVStoreClient

def get_w3_with_priv_key(priv_key: str):
    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    gas_payer = w3.eth.account.from_key(priv_key)
    w3.eth.default_account = gas_payer.address
    w3.middleware_onion.inject(
        SignAndSendRawMiddlewareBuilder.build(priv_key),
        'SignAndSendRawMiddlewareBuilder',
        layer=0,
    )
    return (w3, gas_payer)

(w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
kvstore_client = KVStoreClient(w3)
```

* Without Signer (For read operations only)

```python
from eth_typing import URI
from web3 import Web3
from web3.providers.auto import load_provider_from_uri

from human_protocol_sdk.kvstore import KVStoreClient

w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
kvstore_client = KVStoreClient(w3)
```

## Module

### *class* human_protocol_sdk.kvstore.kvstore_client.KVStoreClient(web3, gas_limit=None)

Bases: `object`

A class used to manage kvstore on the HUMAN network.

#### \_\_init_\_(web3, gas_limit=None)

Initializes a KVStore instance.

* **Parameters:**
  * **web3** (`Web3`) – The Web3 object
  * **gas_limit** (`Optional`[`int`]) – (Optional) Gas limit for transactions

#### set(key, value, tx_options=None)

Sets the value of a key-value pair in the contract.

* **Parameters:**
  * **key** (`str`) – The key of the key-value pair to set
  * **value** (`str`) – The value of the key-value pair to set
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import SignAndSendRawMiddlewareBuilder
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.kvstore import KVStoreClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.inject(
          SignAndSendRawMiddlewareBuilder.build(priv_key),
          'SignAndSendRawMiddlewareBuilder',
          layer=0,
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  kvstore_client = KVStoreClient(w3)
  kvstore_client.set('Role', 'RecordingOracle')
  ```

#### set_bulk(keys, values, tx_options=None)

Sets multiple key-value pairs in the contract.

* **Parameters:**
  * **keys** (`List`[`str`]) – A list of keys to set
  * **values** (`List`[`str`]) – A list of values to set
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import SignAndSendRawMiddlewareBuilder
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.kvstore import KVStoreClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.inject(
          SignAndSendRawMiddlewareBuilder.build(priv_key),
          'SignAndSendRawMiddlewareBuilder',
          layer=0,
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  kvstore_client = KVStoreClient(w3)

  keys = ['Role', 'Webhook_url']
  values = ['RecordingOracle', 'http://localhost']
  kvstore_client.set_bulk(keys, values)
  ```

#### set_file_url_and_hash(url, key='url', tx_options=None)

Sets a URL value for the address that submits the transaction, and its hash.

* **Parameters:**
  * **url** (`str`) – URL to set
  * **key** (`Optional`[`str`]) – Configurable URL key. url by default.
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**KVStoreClientError**](#human_protocol_sdk.kvstore.kvstore_client.KVStoreClientError) – If an error occurs while validating URL, or handling transaction
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import SignAndSendRawMiddlewareBuilder
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.kvstore import KVStoreClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.inject(
          SignAndSendRawMiddlewareBuilder.build(priv_key),
          'SignAndSendRawMiddlewareBuilder',
          layer=0,
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  kvstore_client = KVStoreClient(w3)

  kvstore_client.set_file_url_and_hash('http://localhost')
  kvstore_client.set_file_url_and_hash('https://linkedin.com/me', 'linkedin_url')
  ```

### *exception* human_protocol_sdk.kvstore.kvstore_client.KVStoreClientError

Bases: `Exception`

Raises when some error happens when interacting with kvstore.
