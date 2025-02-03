# human_protocol_sdk.operator.operator_utils module

Utility class for operator-related operations.

## Code Example

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.operator import OperatorUtils, OperatorFilter

print(
    OperatorUtils.get_operators(
        OperatorFilter(chain_id=ChainId.POLYGON_AMOY, roles=["Job Launcher"])
    )
)
```

## Module

### *class* human_protocol_sdk.operator.operator_utils.OperatorData(chain_id, id, address, amount_staked, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reward, amount_jobs_processed, role=None, fee=None, public_key=None, webhook_url=None, website=None, url=None, job_types=None, registration_needed=None, registration_instructions=None, reputation_networks=None, name=None, category=None)

Bases: `object`

#### \_\_init_\_(chain_id, id, address, amount_staked, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reward, amount_jobs_processed, role=None, fee=None, public_key=None, webhook_url=None, website=None, url=None, job_types=None, registration_needed=None, registration_instructions=None, reputation_networks=None, name=None, category=None)

Initializes a OperatorData instance.

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
  * **webhook_url** (`Optional`[`str`]) – Webhook URL
  * **website** (`Optional`[`str`]) – Website URL
  * **url** (`Optional`[`str`]) – URL
  * **job_types** (`Optional`[`List`[`str`]]) – Job types
  * **registration_needed** (`Optional`[`bool`]) – Whether registration is needed
  * **registration_instructions** (`Optional`[`str`]) – Registration instructions
  * **reputation_networks** (`Optional`[`List`[`str`]]) – List of reputation networks
  * **name** (`Optional`[`str`]) – Name
  * **category** (`Optional`[`str`]) – Category

### *class* human_protocol_sdk.operator.operator_utils.OperatorFilter(chain_id, roles=[], min_amount_staked=None, order_by=None, order_direction=OrderDirection.DESC, first=10, skip=0)

Bases: `object`

A class used to filter operators.

#### \_\_init_\_(chain_id, roles=[], min_amount_staked=None, order_by=None, order_direction=OrderDirection.DESC, first=10, skip=0)

Initializes a OperatorFilter instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Chain ID to request data
  * **roles** (`Optional`[`str`]) – Roles to filter by
  * **min_amount_staked** (`Optional`[`int`]) – Minimum amount staked to filter by
  * **order_by** (`Optional`[`str`]) – Property to order by, e.g., “role”
  * **order_direction** ([`OrderDirection`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.OrderDirection)) – Order direction of results, “asc” or “desc”
  * **first** (`int`) – Number of items per page
  * **skip** (`int`) – Number of items to skip (for pagination)

### *class* human_protocol_sdk.operator.operator_utils.OperatorUtils

Bases: `object`

A utility class that provides additional operator-related functionalities.

#### *static* get_operator(chain_id, operator_address)

Gets the operator details.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the operator exists
  * **operator_address** (`str`) – Address of the operator
* **Return type:**
  `Optional`[[`OperatorData`](#human_protocol_sdk.operator.operator_utils.OperatorData)]
* **Returns:**
  Operator data if exists, otherwise None
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.operator import OperatorUtils

  chain_id = ChainId.POLYGON_AMOY
  operator_address = '0x62dD51230A30401C455c8398d06F85e4EaB6309f'

  operator_data = OperatorUtils.get_operator(chain_id, operator_address)
  print(operator_data)
  ```

#### *static* get_operators(filter)

Get operators data of the protocol.

* **Parameters:**
  **filter** ([`OperatorFilter`](#human_protocol_sdk.operator.operator_utils.OperatorFilter)) – Operator filter
* **Return type:**
  `List`[[`OperatorData`](#human_protocol_sdk.operator.operator_utils.OperatorData)]
* **Returns:**
  List of operators data
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.operator import OperatorUtils, OperatorFilter

  print(
      OperatorUtils.get_operators(
          OperatorFilter(chain_id=ChainId.POLYGON_AMOY, roles=["Job Launcher"])
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
  `List`[[`OperatorData`](#human_protocol_sdk.operator.operator_utils.OperatorData)]
* **Returns:**
  Returns an array of operator details
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.operator import OperatorUtils

  operators = OperatorUtils.get_reputation_network_operators(
      ChainId.POLYGON_AMOY,
      '0x62dD51230A30401C455c8398d06F85e4EaB6309f'
  )
  print(operators)
  ```

#### *static* get_rewards_info(chain_id, slasher)

Get rewards of the given slasher.

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
  print(rewards_info)
  ```

### *exception* human_protocol_sdk.operator.operator_utils.OperatorUtilsError

Bases: `Exception`

Raised when an error occurs while interacting with the operator.

### *class* human_protocol_sdk.operator.operator_utils.RewardData(escrow_address, amount)

Bases: `object`

#### \_\_init_\_(escrow_address, amount)

Initializes a RewardData instance.

* **Parameters:**
  * **escrow_address** (`str`) – Escrow address
  * **amount** (`int`) – Amount
