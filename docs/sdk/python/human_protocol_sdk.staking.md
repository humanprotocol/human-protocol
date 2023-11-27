# human_protocol_sdk.staking module

**This module enables to perform actions on staking contracts
and obtain staking information from both the contracts and subgraph.**

Internally, the SDK will use one network or another according to the network ID of the web3.
To use this client, you need to create Web3 instance, and configure default account,
as well as some middlewares.

## A simple example

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

* StakingUtils

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.staking import StakingUtils, LeaderFilter

print(
    StakingUtils.get_leaders(
        LeaderFilter(networks=[ChainId.POLYGON_MUMBAI], role="Job Launcher")
    )
)
```

### *class* human_protocol_sdk.staking.AllocationData(escrow_address, staker, tokens, created_at, closed_at)

Bases: `object`

#### \_\_init_\_(escrow_address, staker, tokens, created_at, closed_at)

Initializes an AllocationData instance.

* **Parameters:**
  * **escrow_address** (`str`) – Escrow address
  * **staker** (`str`) – Staker address
  * **tokens** (`str`) – Amount allocated
  * **created_at** (`str`) – Creation date
  * **closed_at** (`str`) – Closing date

### *class* human_protocol_sdk.staking.LeaderData(chain_id, id, address, amount_staked, amount_allocated, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reputation, reward, amount_jobs_launched, role=None, fee=None, public_key=None, webhook_url=None, url=None)

Bases: `object`

#### \_\_init_\_(chain_id, id, address, amount_staked, amount_allocated, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reputation, reward, amount_jobs_launched, role=None, fee=None, public_key=None, webhook_url=None, url=None)

Initializes an LeaderData instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Chain Identifier
  * **id** (`str`) – Identifier
  * **address** (`str`) – Address
  * **amount_staked** (`int`) – Amount staked
  * **amount_allocated** (`int`) – Amount allocated
  * **amount_locked** (`int`) – Amount locked
  * **locked_until_timestamp** (`int`) – Locked until timestamp
  * **amount_withdrawn** (`int`) – Amount withdrawn
  * **amount_slashed** (`int`) – Amount slashed
  * **reputation** (`int`) – Reputation
  * **reward** (`int`) – Reward
  * **amount_jobs_launched** (`int`) – Amount of jobs launched
  * **role** (`Optional`[`str`]) – Role
  * **fee** (`Optional`[`int`]) – Fee
  * **public_key** (`Optional`[`str`]) – Public key
  * **webhook_url** (`Optional`[`str`]) – Webhook url
  * **url** (`Optional`[`str`]) – Url

### *class* human_protocol_sdk.staking.LeaderFilter(networks, role=None)

Bases: `object`

A class used to filter leaders.

#### \_\_init_\_(networks, role=None)

Initializes a LeaderFilter instance.

* **Parameters:**
  * **networks** (`List`[[`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)]) – Networks to request data
  * **role** (`Optional`[`str`]) – Leader role

### *class* human_protocol_sdk.staking.RewardData(escrow_address, amount)

Bases: `object`

#### \_\_init_\_(escrow_address, amount)

Initializes an RewardData instance.

* **Parameters:**
  * **escrow_address** (`str`) – Escrow address
  * **amount** (`int`) – Amount

### *class* human_protocol_sdk.staking.StakingClient(w3)

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
  `Optional`[[`AllocationData`](#human_protocol_sdk.staking.AllocationData)]
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

### *exception* human_protocol_sdk.staking.StakingClientError

Bases: `Exception`

Raises when some error happens when interacting with staking.

### *class* human_protocol_sdk.staking.StakingUtils

Bases: `object`

A utility class that provides additional staking-related functionalities.

#### *static* get_leader(chain_id, leader_address)

Get the leader details.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the leader exists
  * **leader_address** (`str`) – Address of the leader
* **Return type:**
  `Optional`[[`LeaderData`](#human_protocol_sdk.staking.LeaderData)]
* **Returns:**
  Leader data if exists, otherwise None
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.staking import StakingUtils

  leader = StakingUtils.get_leader(
      ChainId.POLYGON_MUMBAI,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
  )
  ```

#### *static* get_leaders(filter=<human_protocol_sdk.staking.LeaderFilter object>)

Get leaders data of the protocol

* **Parameters:**
  **filter** ([`LeaderFilter`](#human_protocol_sdk.staking.LeaderFilter)) – Leader filter
* **Return type:**
  `List`[[`LeaderData`](#human_protocol_sdk.staking.LeaderData)]
* **Returns:**
  List of leaders data
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.staking import StakingUtils, LeaderFilter

  print(
      StakingUtils.get_leaders(
          LeaderFilter(networks=[ChainId.POLYGON_MUMBAI])
      )
  )
  ```

#### *static* get_rewards_info(chain_id, slasher)

Get rewards of the given slasher

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the slasher exists
  * **slasher** (`str`) – Address of the slasher
* **Return type:**
  `List`[[`RewardData`](#human_protocol_sdk.staking.RewardData)]
* **Returns:**
  List of rewards info
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.staking import StakingUtils

  rewards_info = StakingUtils.get_rewards_info(
      ChainId.POLYGON_MUMBAI,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
  )
  ```
