# human_protocol_sdk.operator.operator_utils module

Utility class for operator-related operations.

## Code Example

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.operator import OperatorUtils, LeaderFilter

print(
    OperatorUtils.get_leaders(
        LeaderFilter(networks=[ChainId.POLYGON_AMOY], role="Job Launcher")
    )
)
```

## Module

### *class* human_protocol_sdk.operator.operator_utils.LeaderData(chain_id, id, address, amount_staked, amount_allocated, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reputation, reward, amount_jobs_launched, role=None, fee=None, public_key=None, webhook_url=None, url=None, job_types=None)

Bases: `object`

#### \_\_init_\_(chain_id, id, address, amount_staked, amount_allocated, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reputation, reward, amount_jobs_launched, role=None, fee=None, public_key=None, webhook_url=None, url=None, job_types=None)

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
  * **job_types** (`Optional`[`List`[`str`]]) – Job types

### *class* human_protocol_sdk.operator.operator_utils.LeaderFilter(chain_id, role=None)

Bases: `object`

A class used to filter leaders.

#### \_\_init_\_(chain_id, role=None)

Initializes a LeaderFilter instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Chain Id to request data
  * **role** (`Optional`[`str`]) – Leader role

### *class* human_protocol_sdk.operator.operator_utils.Operator(address, role, url='', job_types=[])

Bases: `object`

#### \_\_init_\_(address, role, url='', job_types=[])

Initializes an Operator instance.

* **Parameters:**
  * **address** (`str`) – Operator address
  * **role** (`str`) – Role of the operator

### *class* human_protocol_sdk.operator.operator_utils.OperatorUtils

Bases: `object`

A utility class that provides additional operator-related functionalities.

#### *static* get_leader(chain_id, leader_address)

Get the leader details.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the leader exists
  * **leader_address** (`str`) – Address of the leader
* **Return type:**
  `Optional`[[`LeaderData`](#human_protocol_sdk.operator.operator_utils.LeaderData)]
* **Returns:**
  Leader data if exists, otherwise None
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.operator import OperatorUtils

  leader = OperatorUtils.get_leader(
      ChainId.POLYGON_AMOY,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
  )
  ```

#### *static* get_leaders(filter)

Get leaders data of the protocol

* **Parameters:**
  **filter** ([`LeaderFilter`](#human_protocol_sdk.operator.operator_utils.LeaderFilter)) – Leader filter
* **Return type:**
  `List`[[`LeaderData`](#human_protocol_sdk.operator.operator_utils.LeaderData)]
* **Returns:**
  List of leaders data
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.operator import OperatorUtils, LeaderFilter

  print(
      OperatorUtils.get_leaders(
          LeaderFilter(chain_id=ChainId.POLYGON_AMOY)
      )
  )
  ```

#### *static* get_reputation_network_operators(chain_id, address, role=None)

Get the reputation network operators of the specified address.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the reputation network exists
  * **address** (`str`) – Address of the reputation oracle
  * **role** (`Optional`[`str`]) – (Optional) Role of the operator
* **Parem job_types:**
  (Optional) Job types of the operator
* **Return type:**
  `List`[[`Operator`](#human_protocol_sdk.operator.operator_utils.Operator)]
* **Returns:**
  Returns an array of operator details
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.operator import OperatorUtils

  leader = OperatorUtils.get_reputation_network_operators(
      ChainId.POLYGON_AMOY,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
  )
  ```

#### *static* get_rewards_info(chain_id, slasher)

Get rewards of the given slasher

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the slasher exists
  * **slasher** (`str`) – Address of the slasher
* **Return type:**
  `List`[[`RewardData`](#human_protocol_sdk.operator.operator_utils.RewardData)]
* **Returns:**
  List of rewards info
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.operator import OperatorUtils

  rewards_info = OperatorUtils.get_rewards_info(
      ChainId.POLYGON_AMOY,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
  )
  ```

### *exception* human_protocol_sdk.operator.operator_utils.OperatorUtilsError

Bases: `Exception`

Raises when some error happens when interacting with operator.

### *class* human_protocol_sdk.operator.operator_utils.RewardData(escrow_address, amount)

Bases: `object`

#### \_\_init_\_(escrow_address, amount)

Initializes a RewardData instance.

* **Parameters:**
  * **escrow_address** (`str`) – Escrow address
  * **amount** (`int`) – Amount
