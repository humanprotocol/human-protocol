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

### *class* human_protocol_sdk.operator.operator_utils.LeaderData(chain_id, id, address, amount_staked, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reward, amount_jobs_processed, role=None, fee=None, public_key=None, webhook_url=None, website=None, url=None, job_types=None, registration_needed=None, registration_instructions=None, reputation_networks=None, name=None, category=None)

Bases: `object`

#### \_\_init_\_(chain_id, id, address, amount_staked, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reward, amount_jobs_processed, role=None, fee=None, public_key=None, webhook_url=None, website=None, url=None, job_types=None, registration_needed=None, registration_instructions=None, reputation_networks=None, name=None, category=None)

Initializes an LeaderData instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Chain Identifier
  * **id** (`str`) – Identifier
  * **address** (`str`) – Address
  * **amount_staked** (`int`) – Amount staked
  * **amount_locked** (`int`) – Amount locked
  * **locked_until_timestamp** (`int`) – Locked until timestamp
  * **amount_withdrawn** (`int`) – Amount withdrawn
  * **amount_slashed** (`int`) – Amount slashed
  * **reward** (`int`) – Reward
  * **amount_jobs_processed** (`int`) – Amount of jobs launched
  * **role** (`Optional`[`str`]) – Role
  * **fee** (`Optional`[`int`]) – Fee
  * **public_key** (`Optional`[`str`]) – Public key
  * **webhook_url** (`Optional`[`str`]) – Webhook url
  * **website** (`Optional`[`str`]) – Website url
  * **url** (`Optional`[`str`]) – Url
  * **job_types** (`Optional`[`List`[`str`]]) – Job types
  * **registration_needed** (`Optional`[`bool`]) – True
  * **registration_instructions** (`Optional`[`str`]) – Instructions url
  * **reputation_networks** (`Optional`[`List`[`str`]]) – List of reputation networks
  * **name** (`Optional`[`str`]) – Name
  * **category** (`Optional`[`str`]) – Category

### *class* human_protocol_sdk.operator.operator_utils.LeaderFilter(chain_id, roles=[], min_amount_staked=None, order_by=None, order_direction=OrderDirection.DESC, first=10, skip=0)

Bases: `object`

A class used to filter leaders.

#### \_\_init_\_(chain_id, roles=[], min_amount_staked=None, order_by=None, order_direction=OrderDirection.DESC, first=10, skip=0)

Initializes a LeaderFilter instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Chain Id to request data
  * **order_by** (`Optional`[`str`]) – Order by property, “role”
  * **order_direction** ([`OrderDirection`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.OrderDirection)) – Order of results, “asc” or “desc”
  * **first** (`int`) – Number of items per page
  * **skip** (`int`) – Page number to retrieve

### *class* human_protocol_sdk.operator.operator_utils.Operator(address, role, url='', job_types=[], registration_needed=None, registration_instructions=None)

Bases: `object`

#### \_\_init_\_(address, role, url='', job_types=[], registration_needed=None, registration_instructions=None)

Initializes an Operator instance.

* **Parameters:**
  * **address** (`str`) – Operator address
  * **role** (`str`) – Role of the operator
  * **registration_needed** (`Optional`[`bool`]) – True,
  * **registration_instructions** (`Optional`[`str`]) – Instructions url,

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
