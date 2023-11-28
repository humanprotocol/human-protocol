# human_protocol_sdk.staking.staking_client module

This client enables to perform actions on staking contracts and
obtain staking information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the web3.
To use this client, you need to create Web3 instance, and configure default account,
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

### *class* human_protocol_sdk.staking.staking_client.AllocationData(escrow_address, staker, tokens, created_at, closed_at)

Bases: `object`

#### \_\_init_\_(escrow_address, staker, tokens, created_at, closed_at)

Initializes an AllocationData instance.

* **Parameters:**
  * **escrow_address** (`str`) – Escrow address
  * **staker** (`str`) – Staker address
  * **tokens** (`str`) – Amount allocated
  * **created_at** (`str`) – Creation date
  * **closed_at** (`str`) – Closing date

### *class* human_protocol_sdk.staking.staking_client.StakingClient(w3)

Bases: `object`

A class used to manage staking, and allocation on the HUMAN network.

#### \_\_init_\_(w3)

Initializes a Staking instance

* **Parameters:**
  **w3** (`Web3`) – Web3 instance

#### allocate(escrow_address, amount)

Allocates HMT token to the escrow.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow
  * **amount** (`Decimal`) – Amount to allocate
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Amount must be greater than 0
  - Escrow address must be valid
  - Amount must be less than or equal to the staked amount (on-chain)
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
  staking_client.allocate('0x62dD51230A30401C455c8398d06F85e4EaB6309f', amount)
  ```

#### approve_stake(amount)

Approves HMT token for Staking.

* **Parameters:**
  **amount** (`Decimal`) – Amount to approve
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

#### close_allocation(escrow_address)

Closes allocated HMT token from the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Escrow address must be valid
  - Escrow should be cancelled / completed (on-chain)
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

  staking_client.close_allocation('0x62dD51230A30401C455c8398d06F85e4EaB6309f')
  ```

#### distribute_reward(escrow_address)

Pays out rewards to the slashers for the specified escrow address.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
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

  staking_client.distribute_reward('0x62dD51230A30401C455c8398d06F85e4EaB6309f')
  ```

#### get_allocation(escrow_address)

Gets the allocation info for the specified escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `Optional`[[`AllocationData`](#human_protocol_sdk.staking.staking_client.AllocationData)]
* **Returns:**
  Allocation info if escrow exists, otherwise None
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.staking import StakingClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  staking_client = StakingClient(w3)

  allocation = staking_client.get_allocation(
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
  )
  ```

#### slash(slasher, staker, escrow_address, amount)

Slashes HMT token.

* **Parameters:**
  * **slasher** (`str`) – Address of the slasher
  * **staker** (`str`) – Address of the staker
  * **escrow_address** (`str`) – Address of the escrow
  * **amount** (`Decimal`) – Amount to slash
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

#### stake(amount)

Stakes HMT token.

* **Parameters:**
  **amount** (`Decimal`) – Amount to stake
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

  amount = Web3.to_wei(5, 'ether')
      # convert from ETH to WEI
  staking_client.approve_stake(amount)
      # if it was already approved before, this is not necessary
  staking_client.stake(amount)
  ```

#### unstake(amount)

Unstakes HMT token.

* **Parameters:**
  **amount** (`Decimal`) – Amount to unstake
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

#### withdraw()

Withdraws HMT token.

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
