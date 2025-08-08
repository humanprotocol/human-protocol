# human_protocol_sdk.escrow.escrow_utils module

Utility class for escrow-related operations.

## Code Example

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

## Module

### *class* human_protocol_sdk.escrow.escrow_utils.EscrowData(chain_id, id, address, amount_paid, balance, count, factory_address, launcher, status, token, total_funded_amount, created_at, final_results_url=None, intermediate_results_url=None, manifest_hash=None, manifest=None, recording_oracle=None, reputation_oracle=None, exchange_oracle=None)

Bases: `object`

#### \_\_init_\_(chain_id, id, address, amount_paid, balance, count, factory_address, launcher, status, token, total_funded_amount, created_at, final_results_url=None, intermediate_results_url=None, manifest_hash=None, manifest=None, recording_oracle=None, reputation_oracle=None, exchange_oracle=None)

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
  * **manifest** (`Optional`[`str`]) – Manifest data (JSON/URL).
  * **recording_oracle** (`Optional`[`str`]) – Recording Oracle address.
  * **reputation_oracle** (`Optional`[`str`]) – Reputation Oracle address.
  * **exchange_oracle** (`Optional`[`str`]) – Exchange Oracle address.

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

#### *static* get_escrows(filter)

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

#### *static* get_payouts(filter)

Fetch payouts from the subgraph based on the provided filter.

* **Parameters:**
  **filter** ([`PayoutFilter`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.PayoutFilter)) – Object containing all the necessary parameters to filter payouts.
* **Return List[Payout]:**
  List of payouts matching the query parameters.
* **Raises:**
  [**EscrowClientError**](human_protocol_sdk.escrow.escrow_client.md#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an unsupported chain ID or invalid addresses are provided.
* **Return type:**
  `List`[[`Payout`](#human_protocol_sdk.escrow.escrow_utils.Payout)]

#### *static* get_status_events(filter)

Retrieve status events for specified networks and statuses within a date range.

* **Parameters:**
  **filter** ([`StatusEventFilter`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.StatusEventFilter)) – Object containing all the necessary parameters to filter status events.
* **Return List[StatusEvent]:**
  List of status events matching the query parameters.
* **Raises:**
  [**EscrowClientError**](human_protocol_sdk.escrow.escrow_client.md#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an unsupported chain ID or invalid launcher address is provided.
* **Return type:**
  `List`[[`StatusEvent`](#human_protocol_sdk.escrow.escrow_utils.StatusEvent)]

### *class* human_protocol_sdk.escrow.escrow_utils.Payout(id, escrow_address, recipient, amount, created_at)

Bases: `object`

Initializes a Payout instance.

* **Parameters:**
  * **id** (`str`) – The id of the payout.
  * **chain_id** – The chain identifier where the payout occurred.
  * **escrow_address** (`str`) – The address of the escrow that executed the payout.
  * **recipient** (`str`) – The address of the recipient.
  * **amount** (`int`) – The amount of the payout.
  * **created_at** (`int`) – The time of creation of the payout.

#### \_\_init_\_(id, escrow_address, recipient, amount, created_at)

### *class* human_protocol_sdk.escrow.escrow_utils.StatusEvent(timestamp, status, chain_id, escrow_address)

Bases: `object`

Initializes a StatusEvent instance.

* **Parameters:**
  * **timestamp** (`int`) – The timestamp of the event.
  * **status** (`str`) – The status of the escrow.
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – The chain identifier where the event occurred.
  * **escrow_address** (`str`) – The address of the escrow.

#### \_\_init_\_(timestamp, status, chain_id, escrow_address)
