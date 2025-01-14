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
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.auto import load_provider_from_uri

from human_protocol_sdk.staking import StakingClient

def get_w3_with_priv_key(priv_key: str):
    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    gas_payer = w3.eth.account.from_key(priv_key)
    w3.eth.default_account = gas_payer.address
    w3.middleware_onion.add(
        construct_sign_and_send_raw_middleware(gas_payer),
        "construct_sign_and_send_raw_middleware",
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

#### approve_stake(amount, tx_options=None)

Approves HMT token for Staking.

* **Parameters:**
  * **amount** (`Decimal`) – Amount to approve
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  Amount must be greater than 0
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.staking import StakingClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  staking_client = StakingClient(w3)

  amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
  staking_client.approve_stake(amount)
  ```

#### slash(slasher, staker, escrow_address, amount, tx_options=None)

Slashes HMT token.

* **Parameters:**
  * **slasher** (`str`) – Address of the slasher
  * **staker** (`str`) – Address of the staker
  * **escrow_address** (`str`) – Address of the escrow
  * **amount** (`Decimal`) – Amount to slash
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Amount must be greater than 0
  - Amount must be less than or equal to the amount allocated to the escrow (on-chain)
  - Escrow address must be valid
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.staking import StakingClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  staking_client = StakingClient(w3)

  amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
  staking_client.slash(
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f',
      amount
  )
  ```

#### stake(amount, tx_options=None)

Stakes HMT token.

* **Parameters:**
  * **amount** (`Decimal`) – Amount to stake
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Amount must be greater than 0
  - Amount must be less than or equal to the approved amount (on-chain)
  - Amount must be less than or equal to the balance of the staker (on-chain)
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.staking import StakingClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  staking_client = StakingClient(w3)

  amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
  staking_client.approve_stake(amount) # if it was already approved before, this is not necessary
  staking_client.stake(amount)
  ```

#### unstake(amount, tx_options=None)

Unstakes HMT token.

* **Parameters:**
  * **amount** (`Decimal`) – Amount to unstake
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Amount must be greater than 0
  - Amount must be less than or equal to the staked amount which is not locked / allocated (on-chain)
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.staking import StakingClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  staking_client = StakingClient(w3)

  amount = Web3.to_wei(5, 'ether') # convert from ETH to WEI
  staking_client.unstake(amount)
  ```

#### withdraw(tx_options=None)

Withdraws HMT token.

* **Parameters:**
  **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - There must be unstaked tokens which is unlocked (on-chain)
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.staking import StakingClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  staking_client = StakingClient(w3)

  staking_client.withdraw()
  ```

### *exception* human_protocol_sdk.staking.staking_client.StakingClientError

Bases: `Exception`

Raises when some error happens when interacting with staking.
