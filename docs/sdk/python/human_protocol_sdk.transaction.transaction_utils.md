# human_protocol_sdk.transaction.transaction_utils module

Utility class for transaction-related operations.

## Code Example

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.transaction import TransactionUtils, TransactionFilter

print(
    TransactionUtils.get_transactions(
        TransactionFilter(
            networks=[ChainId.POLYGON_AMOY],
            from_address="0x1234567890123456789012345678901234567890",
            to_address="0x0987654321098765432109876543210987654321",
            start_date=datetime.datetime(2023, 5, 8),
            end_date=datetime.datetime(2023, 6, 8),
        )
    )
)
```

## Module

### *class* human_protocol_sdk.transaction.transaction_utils.TransactionData(chain_id, block, hash, from_address, to_address, timestamp, value, method)

Bases: `object`

#### \_\_init_\_(chain_id, block, hash, from_address, to_address, timestamp, value, method)

### *class* human_protocol_sdk.transaction.transaction_utils.TransactionUtils

Bases: `object`

A utility class that provides additional transaction-related functionalities.

#### *static* get_transaction(chain_id, hash)

Returns the transaction for a given hash.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the transaction was executed
  * **hash** (`str`) – Hash of the transaction
* **Return type:**
  `Optional`[[`TransactionData`](#human_protocol_sdk.transaction.transaction_utils.TransactionData)]
* **Returns:**
  Transaction data
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.transaction import TransactionUtils

  print(
      TransactionUtils.get_transaction(
          ChainId.POLYGON_AMOY,
          "0x1234567890123456789012345678901234567891"
      )
  )
  ```

#### *static* get_transactions(filter)

Get an array of transactions based on the specified filter parameters.

* **Parameters:**
  **filter** ([`TransactionFilter`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.TransactionFilter)) – Object containing all the necessary parameters to filter
* **Return type:**
  `List`[[`TransactionData`](#human_protocol_sdk.transaction.transaction_utils.TransactionData)]
* **Returns:**
  List of transactions
* **Example:**
  ```python
  from human_protocol_sdk.constants import ChainId
  from human_protocol_sdk.transaction import TransactionUtils, TransactionFilter

  print(
      TransactionUtils.get_transactions(
          TransactionFilter(
              chain_id=ChainId.POLYGON_AMOY,
              from_address="0x1234567890123456789012345678901234567890",
              to_address="0x0987654321098765432109876543210987654321",
              start_date=datetime.datetime(2023, 5, 8),
              end_date=datetime.datetime(2023, 6, 8),
          )
      )
  )
  ```

### *exception* human_protocol_sdk.transaction.transaction_utils.TransactionUtilsError

Bases: `Exception`

Raises when some error happens when getting data from subgraph.
