# human_protocol_sdk.staking.staking_utils module

**Utility class for staking-related operations.**

## Code Example

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.staking import StakingUtils, LeaderFilter

print(
    StakingUtils.get_leaders(
        LeaderFilter(networks=[ChainId.POLYGON_MUMBAI], role="Job Launcher")
    )
)
```

### *class* human_protocol_sdk.staking.staking_utils.LeaderData(chain_id, id, address, amount_staked, amount_allocated, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reputation, reward, amount_jobs_launched, role=None, fee=None, public_key=None, webhook_url=None, url=None)

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

### *class* human_protocol_sdk.staking.staking_utils.LeaderFilter(networks, role=None)

Bases: `object`

A class used to filter leaders.

#### \_\_init_\_(networks, role=None)

Initializes a LeaderFilter instance.

* **Parameters:**
  * **networks** (`List`[[`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)]) – Networks to request data
  * **role** (`Optional`[`str`]) – Leader role

### *class* human_protocol_sdk.staking.staking_utils.RewardData(escrow_address, amount)

Bases: `object`

#### \_\_init_\_(escrow_address, amount)

Initializes an RewardData instance.

* **Parameters:**
  * **escrow_address** (`str`) – Escrow address
  * **amount** (`int`) – Amount

### *class* human_protocol_sdk.staking.staking_utils.StakingUtils

Bases: `object`

A utility class that provides additional staking-related functionalities.

#### *static* get_leader(chain_id, leader_address)

Get the leader details.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the leader exists
  * **leader_address** (`str`) – Address of the leader
* **Return type:**
  `Optional`[[`LeaderData`](#human_protocol_sdk.staking.staking_utils.LeaderData)]
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

#### *static* get_leaders(filter=<human_protocol_sdk.staking.staking_utils.LeaderFilter object>)

Get leaders data of the protocol

* **Parameters:**
  **filter** ([`LeaderFilter`](#human_protocol_sdk.staking.staking_utils.LeaderFilter)) – Leader filter
* **Return type:**
  `List`[[`LeaderData`](#human_protocol_sdk.staking.staking_utils.LeaderData)]
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
  `List`[[`RewardData`](#human_protocol_sdk.staking.staking_utils.RewardData)]
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
