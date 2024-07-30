# human_protocol_sdk.statistics.statistics_client module

This client enables to obtain statistical information from the subgraph.

## Code Example

```python
from human_protocol_sdk.constants import ChainId
from human_protocol_sdk.statistics import StatisticsClient

statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)
```

## Module

### *class* human_protocol_sdk.statistics.statistics_client.DailyEscrowData(timestamp, escrows_total, escrows_pending, escrows_solved, escrows_paid, escrows_cancelled)

Bases: `object`

A class used to specify daily escrow data.

#### \_\_init_\_(timestamp, escrows_total, escrows_pending, escrows_solved, escrows_paid, escrows_cancelled)

Initializes a DailyEscrowData instance.

* **Parameters:**
  * **timestamp** (`datetime`) – Timestamp
  * **escrows_total** (`int`) – Total escrows
  * **escrows_pending** (`int`) – Pending escrows
  * **escrows_solved** (`int`) – Solved escrows
  * **escrows_paid** (`int`) – Paid escrows
  * **escrows_cancelled** (`int`) – Cancelled escrows

### *class* human_protocol_sdk.statistics.statistics_client.DailyHMTData(timestamp, total_transaction_amount, total_transaction_count, daily_unique_senders, daily_unique_receivers)

Bases: `object`

A class used to specify daily HMT data.

#### \_\_init_\_(timestamp, total_transaction_amount, total_transaction_count, daily_unique_senders, daily_unique_receivers)

Initializes a DailyHMTData instance.

* **Parameters:**
  * **timestamp** (`datetime`) – Timestamp
  * **total_transaction_amount** (`int`) – Total transaction amount
  * **total_transaction_count** (`int`) – Total transaction count
  * **daily_unique_senders** (`int`) – Total unique senders
  * **daily_unique_receivers** (`int`) – Total unique receivers

### *class* human_protocol_sdk.statistics.statistics_client.DailyPaymentData(timestamp, total_amount_paid, total_count, average_amount_per_worker)

Bases: `object`

A class used to specify daily payment data.

#### \_\_init_\_(timestamp, total_amount_paid, total_count, average_amount_per_worker)

Initializes a DailyPaymentData instance.

* **Parameters:**
  * **timestamp** (`datetime`) – Timestamp
  * **total_amount_paid** (`int`) – Total amount paid
  * **total_count** (`int`) – Total count
  * **average_amount_per_worker** (`int`) – Average amount per worker

### *class* human_protocol_sdk.statistics.statistics_client.DailyWorkerData(timestamp, active_workers)

Bases: `object`

A class used to specify daily worker data.

#### \_\_init_\_(timestamp, active_workers)

Initializes a DailyWorkerData instance.

* **Parameters:**
  * **timestamp** (`datetime`) – Timestamp
  * **active_workers** (`int`) – Active workers

### *class* human_protocol_sdk.statistics.statistics_client.EscrowStatistics(total_escrows, daily_escrows_data)

Bases: `object`

A class used to specify escrow statistics.

#### \_\_init_\_(total_escrows, daily_escrows_data)

Initializes a EscrowStatistics instance.

* **Parameters:**
  * **total_escrows** (`int`) – Total escrows
  * **daily_escrows_data** (`List`[[`DailyEscrowData`](#human_protocol_sdk.statistics.statistics_client.DailyEscrowData)]) – Daily escrows data

### *class* human_protocol_sdk.statistics.statistics_client.HMTHolder(address, balance)

Bases: `object`

A class used to specify HMT holder.

#### \_\_init_\_(address, balance)

Initializes a HMTHolder instance.

* **Parameters:**
  * **address** (`str`) – Holder address
  * **balance** (`int`) – Holder balance

### *class* human_protocol_sdk.statistics.statistics_client.HMTHoldersParam(address=None, order_direction='asc')

Bases: `object`

A class used to specify parameters for querying HMT holders.

#### \_\_init_\_(address=None, order_direction='asc')

Initializes a HMTHoldersParam instance.

* **Parameters:**
  * **address** (`Optional`[`str`]) – Filter by holder’s address
  * **order_direction** (`str`) – Optional. Direction of sorting (‘asc’ for ascending, ‘desc’ for descending)

### *class* human_protocol_sdk.statistics.statistics_client.HMTStatistics(total_transfer_amount, total_transfer_count, total_holders, holders, daily_hmt_data)

Bases: `object`

A class used to specify HMT statistics.

#### \_\_init_\_(total_transfer_amount, total_transfer_count, total_holders, holders, daily_hmt_data)

Initializes a HMTStatistics instance.

* **Parameters:**
  * **total_transfer_amount** (`int`) – Total transfer amount
  * **total_transfer_count** (`int`) – Total transfer count
  * **total_holders** (`int`) – Total holders
  * **holders** (`List`[[`HMTHolder`](#human_protocol_sdk.statistics.statistics_client.HMTHolder)]) – Holders
  * **daily_hmt_data** (`List`[[`DailyHMTData`](#human_protocol_sdk.statistics.statistics_client.DailyHMTData)]) – Daily HMT data

### *class* human_protocol_sdk.statistics.statistics_client.PaymentStatistics(daily_payments_data)

Bases: `object`

A class used to specify payment statistics.

#### \_\_init_\_(daily_payments_data)

Initializes a PaymentStatistics instance.

* **Parameters:**
  **daily_payments_data** (`List`[[`DailyPaymentData`](#human_protocol_sdk.statistics.statistics_client.DailyPaymentData)]) – Daily payments data

### *class* human_protocol_sdk.statistics.statistics_client.StatisticsClient(chain_id=ChainId.POLYGON_AMOY)

Bases: `object`

A client used to get statistical data.

#### \_\_init_\_(chain_id=ChainId.POLYGON_AMOY)

Initializes a Statistics instance

* **Parameters:**
  **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Chain ID to get statistical data from

#### get_escrow_statistics(param=<human_protocol_sdk.statistics.statistics_client.StatisticsParam object>)

Get escrow statistics data for the given date range.

* **Parameters:**
  **param** ([`StatisticsParam`](#human_protocol_sdk.statistics.statistics_client.StatisticsParam)) – Object containing the date range
* **Return type:**
  [`EscrowStatistics`](#human_protocol_sdk.statistics.statistics_client.EscrowStatistics)
* **Returns:**
  Escrow statistics data
* **Example:**
  ```python
  from human_protocol_sdk.contants import ChainId
  from human_protocol_sdk.statistics import StatisticsClient, StatisticsParam

  statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

  print(statistics_client.get_escrow_statistics())
  print(
      statistics_client.get_escrow_statistics(
          StatisticsParam(
              date_from=datetime.datetime(2023, 5, 8),
              date_to=datetime.datetime(2023, 6, 8),
          )
      )
  )
  ```

#### get_hmt_holders(param=<human_protocol_sdk.statistics.statistics_client.HMTHoldersParam object>)

Get HMT holders data with optional filters and ordering.

* **Parameters:**
  **param** ([`HMTHoldersParam`](#human_protocol_sdk.statistics.statistics_client.HMTHoldersParam)) – Object containing filter and order parameters
* **Return type:**
  `List`[[`HMTHolder`](#human_protocol_sdk.statistics.statistics_client.HMTHolder)]
* **Returns:**
  List of HMT holders
* **Example:**
  ```python
  from human_protocol_sdk.contants import ChainId
  from human_protocol_sdk.statistics import StatisticsClient, HMTHoldersParam

  statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

  print(statistics_client.get_hmt_holders())
  print(
      statistics_client.get_hmt_holders(
          HMTHoldersParam(
              address="0x123...",
              order_direction="asc",
          )
      )
  )
  ```

#### get_hmt_statistics(param=<human_protocol_sdk.statistics.statistics_client.StatisticsParam object>)

Get HMT statistics data for the given date range.

* **Parameters:**
  **param** ([`StatisticsParam`](#human_protocol_sdk.statistics.statistics_client.StatisticsParam)) – Object containing the date range
* **Return type:**
  [`HMTStatistics`](#human_protocol_sdk.statistics.statistics_client.HMTStatistics)
* **Returns:**
  HMT statistics data
* **Example:**
  ```python
  from human_protocol_sdk.contants import ChainId
  from human_protocol_sdk.statistics import StatisticsClient, StatisticsParam

  statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

  print(statistics_client.get_hmt_statistics())
  print(
      statistics_client.get_hmt_statistics(
          StatisticsParam(
              date_from=datetime.datetime(2023, 5, 8),
              date_to=datetime.datetime(2023, 6, 8),
          )
      )
  )
  ```

#### get_payment_statistics(param=<human_protocol_sdk.statistics.statistics_client.StatisticsParam object>)

Get payment statistics data for the given date range.

* **Parameters:**
  **param** ([`StatisticsParam`](#human_protocol_sdk.statistics.statistics_client.StatisticsParam)) – Object containing the date range
* **Return type:**
  [`PaymentStatistics`](#human_protocol_sdk.statistics.statistics_client.PaymentStatistics)
* **Returns:**
  Payment statistics data
* **Example:**
  ```python
  from human_protocol_sdk.contants import ChainId
  from human_protocol_sdk.statistics import StatisticsClient, StatisticsParam

  statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

  print(statistics_client.get_payment_statistics())
  print(
      statistics_client.get_payment_statistics(
          StatisticsParam(
              date_from=datetime.datetime(2023, 5, 8),
              date_to=datetime.datetime(2023, 6, 8),
          )
      )
  )
  ```

#### get_worker_statistics(param=<human_protocol_sdk.statistics.statistics_client.StatisticsParam object>)

Get worker statistics data for the given date range.

* **Parameters:**
  **param** ([`StatisticsParam`](#human_protocol_sdk.statistics.statistics_client.StatisticsParam)) – Object containing the date range
* **Return type:**
  [`WorkerStatistics`](#human_protocol_sdk.statistics.statistics_client.WorkerStatistics)
* **Returns:**
  Worker statistics data
* **Example:**
  ```python
  from human_protocol_sdk.contants import ChainId
  from human_protocol_sdk.statistics import StatisticsClient, StatisticsParam

  statistics_client = StatisticsClient(ChainId.POLYGON_AMOY)

  print(statistics_client.get_worker_statistics())
  print(
      statistics_client.get_worker_statistics(
          StatisticsParam(
              date_from=datetime.datetime(2023, 5, 8),
              date_to=datetime.datetime(2023, 6, 8),
          )
      )
  )
  ```

### *exception* human_protocol_sdk.statistics.statistics_client.StatisticsClientError

Bases: `Exception`

Raises when some error happens when getting data from subgraph.

### *class* human_protocol_sdk.statistics.statistics_client.StatisticsParam(date_from=None, date_to=None, limit=None)

Bases: `object`

A class used to specify statistics params.

#### \_\_init_\_(date_from=None, date_to=None, limit=None)

Initializes a StatisticsParam instance.

* **Parameters:**
  * **date_from** (`Optional`[`datetime`]) – Statistical data from date
  * **date_to** (`Optional`[`datetime`]) – Statistical data to date
  * **limit** (`Optional`[`int`]) – Limit of statistical data

### *class* human_protocol_sdk.statistics.statistics_client.WorkerStatistics(daily_workers_data)

Bases: `object`

A class used to specify worker statistics.

#### \_\_init_\_(daily_workers_data)

Initializes a WorkerStatistics instance.

* **Parameters:**
  **daily_workers_data** (`List`[[`DailyWorkerData`](#human_protocol_sdk.statistics.statistics_client.DailyWorkerData)]) – Daily workers data
