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

#### get(address, key)

Gets the value of a key-value pair in the contract.
:type address: `str`
:param address: The Ethereum address associated with the key-value pair
:type key: `str`
:param key: The key of the key-value pair to get
:rtype: `str`
:return: The value of the key-value pair if it exists
:example:

#### set(\*args, \*\*kwargs)

#### set_bulk(\*args, \*\*kwargs)

#### set_file_url_and_hash(\*args, \*\*kwargs)

### *exception* human_protocol_sdk.kvstore.kvstore_client.KVStoreClientError

Bases: `Exception`

Raises when some error happens when interacting with kvstore.
