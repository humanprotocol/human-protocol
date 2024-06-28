# human_protocol_sdk.escrow.escrow_utils module

Utility class for escrow-related operations.

## Code Example

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.escrow import EscrowUtils, EscorwFilter, Status

print(
    EscrowUtils.get_escrows(
        EscrowFilter(
            networks=[ChainId.POLYGON_AMOY],
            status=Status.Pending,
            date_from=datetime.datetime(2023, 5, 8),
            date_to=datetime.datetime(2023, 6, 8),
        )
    )
)
```

## Module

### *class* human_protocol_sdk.escrow.escrow_utils.EscrowData(chain_id, id, address, amount_paid, balance, count, factory_address, launcher, status, token, total_funded_amount, created_at, final_results_url=None, intermediate_results_url=None, manifest_hash=None, manifest_url=None, recording_oracle=None, recording_oracle_fee=None, reputation_oracle=None, reputation_oracle_fee=None, exchange_oracle=None, exchange_oracle_fee=None)

Bases: `object`

#### \_\_init_\_(chain_id, id, address, amount_paid, balance, count, factory_address, launcher, status, token, total_funded_amount, created_at, final_results_url=None, intermediate_results_url=None, manifest_hash=None, manifest_url=None, recording_oracle=None, recording_oracle_fee=None, reputation_oracle=None, reputation_oracle_fee=None, exchange_oracle=None, exchange_oracle_fee=None)

Initializes an EscrowData instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Chain identifier
  * **id** (`str`) – Identifier
  * **address** (`str`) – Address
  * **amount_paid** (`int`) – Amount paid
  * **balance** (`int`) – Balance
  * **count** (`int`) – Count
  * **factory_address** (`str`) – Factory address
  * **launcher** (`str`) – Launcher
  * **status** (`str`) – Status
  * **token** (`str`) – Token
  * **total_funded_amount** (`int`) – Total funded amount
  * **created_at** (`datetime`) – Creation date
  * **final_results_url** (`Optional`[`str`]) – URL for final results.
  * **intermediate_results_url** (`Optional`[`str`]) – URL for intermediate results.
  * **manifest_hash** (`Optional`[`str`]) – Manifest hash.
  * **manifest_url** (`Optional`[`str`]) – Manifest URL.
  * **recording_oracle** (`Optional`[`str`]) – Recording Oracle address.
  * **recording_oracle_fee** (`Optional`[`int`]) – Recording Oracle fee.
  * **reputation_oracle** (`Optional`[`str`]) – Reputation Oracle address.
  * **reputation_oracle_fee** (`Optional`[`int`]) – Reputation Oracle fee.
  * **exchange_oracle** (`Optional`[`str`]) – Exchange Oracle address.
  * **exchange_oracle_fee** (`Optional`[`int`]) – Exchange Oracle fee.

### *class* human_protocol_sdk.escrow.escrow_utils.EscrowUtils

Bases: `object`

A utility class that provides additional escrow-related functionalities.

#### *static* get_escrow(chain_id, escrow_address)

Returns the escrow for a given address.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the escrow has been deployed
  * **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `Optional`[[`EscrowData`](#human_protocol_sdk.escrow.escrow_utils.EscrowData)]
* **Returns:**
  Escrow data
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.escrow import EscrowUtils

  print(
      EscrowUtils.get_escrow(
          ChainId.POLYGON_AMOY,
          "0x1234567890123456789012345678901234567890"
      )
  )
  ```

#### *static* get_escrows(filter=<human_protocol_sdk.filter.EscrowFilter object>)

Get an array of escrow addresses based on the specified filter parameters.

* **Parameters:**
  **filter** ([`EscrowFilter`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.EscrowFilter)) – Object containing all the necessary parameters to filter
* **Return type:**
  `List`[[`EscrowData`](#human_protocol_sdk.escrow.escrow_utils.EscrowData)]
* **Returns:**
  List of escrows
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.escrow import EscrowUtils, EscrowFilter, Status

  print(
      EscrowUtils.get_escrows(
          EscrowFilter(
              networks=[ChainId.POLYGON_AMOY],
              status=Status.Pending,
              date_from=datetime.datetime(2023, 5, 8),
              date_to=datetime.datetime(2023, 6, 8),
          )
      )
  )
  ```

#### *static* get_status_events(networks, statuses=None, date_from=None, date_to=None, launcher=None)

Retrieve status events for specified networks and statuses within a date range.

* **Parameters:**
  * **(****List****[****ChainId****]****)** (*networks*) – List of network chain IDs to query.
  * **(****Optional****[****List****[****Status****]****]****)** (*statuses*) – List of statuses to filter by.
  * **(****Optional****[****datetime****]****)** (*date_to*) – Start date for the query range.
  * **(****Optional****[****datetime****]****)** – End date for the query range.
  * **(****Optional****[****str****]****)** (*launcher*) – Address of the launcher to filter by.
* **Return List[StatusEvent]:**
  List of status events matching the query parameters.
* **Raises:**
  [**EscrowClientError**](human_protocol_sdk.escrow.escrow_client.md#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an unsupported chain ID or invalid launcher address is provided.
* **Example:**
  ```python
  from datetime import datetime
  from human_protocol_sdk.constants import ChainId, Status
  from human_protocol_sdk.escrow import EscrowUtils

  print(
      EscrowUtils.get_status_events(
          networks=[ChainId.POLYGON_AMOY, ChainId.ETHEREUM],
          statuses=[Status.Pending, Status.Paid],
          date_from=datetime(2023, 1, 1),
          date_to=datetime(2023, 12, 31),
          launcher="0x1234567890abcdef1234567890abcdef12345678"
      )
  )
  ```
* **Return type:**
  `List`[[`StatusEvent`](#human_protocol_sdk.escrow.escrow_utils.StatusEvent)]

### *class* human_protocol_sdk.escrow.escrow_utils.StatusEvent(timestamp, status, chain_id, escrow_address)

Bases: `object`

Initializes a StatusEvent instance.

* **Parameters:**
  * **timestamp** (`int`) – The timestamp of the event.
  * **status** (`str`) – The status of the escrow.
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – The chain identifier where the event occurred.
  * **escrow_address** (`str`) – The address of the escrow.

#### \_\_init_\_(timestamp, status, chain_id, escrow_address)
