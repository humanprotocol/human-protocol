# human_protocol_sdk.staking.staking_client module

This client enables performing actions on staking contracts and
obtaining staking information from both the contracts and subgraph.

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

from human_protocol_sdk.staking import StakingClient

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
staking_client = StakingClient(w3)
```

* Without Signer (For read operations only)

```python
from eth_typing import URI
from web3 import Web3
from web3.providers.auto import load_provider_from_uri

from human_protocol_sdk.staking import StakingClient

w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
staking_client = StakingClient(w3)
```

## Module

### *class* human_protocol_sdk.staking.staking_client.StakingClient(w3)

Bases: `object`

A class used to manage staking on the HUMAN network.

#### \_\_init_\_(w3)

Initializes a Staking instance

* **Parameters:**
  **w3** (`Web3`) – Web3 instance

#### approve_stake(\*args, \*\*kwargs)

#### get_staker_info(staker_address)

Retrieves comprehensive staking information for a staker.

* **Parameters:**
  **staker_address** (`str`) – The address of the staker
* **Return type:**
  `dict`
* **Returns:**
  A dictionary containing staker information
* **Validate:**
  - Staker address must be valid
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.staking import StakingClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  staking_client = StakingClient(w3)

  staking_info = staking_client.get_staker_info('0xYourStakerAddress')
  print(staking_info['stakedAmount'])
  ```

#### slash(\*args, \*\*kwargs)

#### stake(\*args, \*\*kwargs)

#### unstake(\*args, \*\*kwargs)

#### withdraw(\*args, \*\*kwargs)

### *exception* human_protocol_sdk.staking.staking_client.StakingClientError

Bases: `Exception`

Raises when some error happens when interacting with staking.
