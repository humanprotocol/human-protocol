# human_protocol_sdk.filter module

### *class* human_protocol_sdk.filter.EscrowFilter(chain_id, launcher=None, reputation_oracle=None, recording_oracle=None, exchange_oracle=None, job_requester_id=None, status=None, date_from=None, date_to=None, first=10, skip=0, order_direction=OrderDirection.DESC)

Bases: `object`

A class used to filter escrow requests.

#### \_\_init_\_(chain_id, launcher=None, reputation_oracle=None, recording_oracle=None, exchange_oracle=None, job_requester_id=None, status=None, date_from=None, date_to=None, first=10, skip=0, order_direction=OrderDirection.DESC)

Initializes a EscrowFilter instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network to request data
  * **launcher** (`Optional`[`str`]) – Launcher address
  * **reputation_oracle** (`Optional`[`str`]) – Reputation oracle address
  * **recording_oracle** (`Optional`[`str`]) – Recording oracle address
  * **exchange_oracle** (`Optional`[`str`]) – Exchange oracle address
  * **job_requester_id** (`Optional`[`str`]) – Job requester id
  * **status** (`Optional`[[`Status`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.Status)]) – Escrow status
  * **date_from** (`Optional`[`datetime`]) – Created from date
  * **date_to** (`Optional`[`datetime`]) – Created to date
  * **first** (`int`) – Number of items per page
  * **skip** (`int`) – Page number to retrieve
  * **order_direction** ([`OrderDirection`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.OrderDirection)) – Order of results, “asc” or “desc”

### *exception* human_protocol_sdk.filter.FilterError

Bases: `Exception`

Raises when some error happens when building filter object.

### *class* human_protocol_sdk.filter.PayoutFilter(chain_id, escrow_address=None, recipient=None, date_from=None, date_to=None, first=10, skip=0, order_direction=OrderDirection.DESC)

Bases: `object`

A class used to filter payout requests.

#### \_\_init_\_(chain_id, escrow_address=None, recipient=None, date_from=None, date_to=None, first=10, skip=0, order_direction=OrderDirection.DESC)

Initializes a filter for payouts.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – The chain ID where the payouts are recorded.
  * **escrow_address** (`Optional`[`str`]) – Optional escrow address to filter payouts.
  * **recipient** (`Optional`[`str`]) – Optional recipient address to filter payouts.
  * **date_from** (`Optional`[`datetime`]) – Optional start date for filtering.
  * **date_to** (`Optional`[`datetime`]) – Optional end date for filtering.
  * **first** (`int`) – Optional number of payouts per page. Default is 10.
  * **skip** (`int`) – Optional number of payouts to skip. Default is 0.
  * **order_direction** ([`OrderDirection`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.OrderDirection)) – Optional order direction. Default is DESC.

### *class* human_protocol_sdk.filter.StatisticsFilter(date_from=None, date_to=None, first=10, skip=0, order_direction=OrderDirection.ASC)

Bases: `object`

A class used to filter statistical data.

* **Parameters:**
  * **date_from** (`Optional`[`datetime`]) – Start date for the query range.
  * **date_to** (`Optional`[`datetime`]) – End date for the query range.
  * **first** (`int`) – Number of items per page.
  * **skip** (`int`) – Page number to retrieve.
  * **order_direction** ([`OrderDirection`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.OrderDirection)) – Order of results, “asc” or “desc”.
* **Example:**
  ```python
  from datetime import datetime
  from human_protocol_sdk.filter import StatisticsFilter

  filter = StatisticsFilter(
      date_from=datetime(2023, 1, 1),
      date_to=datetime(2023, 12, 31),
      first=10,
      skip=0,
      order_direction=OrderDirection.ASC
  )
  ```

#### \_\_init_\_(date_from=None, date_to=None, first=10, skip=0, order_direction=OrderDirection.ASC)

### *class* human_protocol_sdk.filter.StatusEventFilter(chain_id, statuses=None, date_from=None, date_to=None, launcher=None, first=10, skip=0, order_direction=OrderDirection.DESC)

Bases: `object`

#### \_\_init_\_(chain_id, statuses=None, date_from=None, date_to=None, launcher=None, first=10, skip=0, order_direction=OrderDirection.DESC)

Initializes a filter for status events.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – The chain ID where the events are recorded.
  * **statuses** (`Optional`[`List`[[`Status`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.Status)]]) – Optional list of statuses to filter by.
  * **date_from** (`Optional`[`datetime`]) – Optional start date for filtering.
  * **date_to** (`Optional`[`datetime`]) – Optional end date for filtering.
  * **launcher** (`Optional`[`str`]) – Optional launcher address to filter by.
  * **first** (`int`) – Optional number of events per page. Default is 10.
  * **skip** (`int`) – Optional number of events to skip. Default is 0.
  * **order_direction** ([`OrderDirection`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.OrderDirection)) – Optional order direction. Default is DESC.

### *class* human_protocol_sdk.filter.TransactionFilter(chain_id, from_address=None, to_address=None, start_date=None, end_date=None, start_block=None, end_block=None, method=None, escrow=None, token=None, first=10, skip=0, order_direction=OrderDirection.DESC)

Bases: `object`

A class used to filter transactions.

#### \_\_init_\_(chain_id, from_address=None, to_address=None, start_date=None, end_date=None, start_block=None, end_block=None, method=None, escrow=None, token=None, first=10, skip=0, order_direction=OrderDirection.DESC)

Initializes a TransactionsFilter instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Chain ID to filter transactions from
  * **from_address** (`Optional`[`str`]) – Sender address
  * **to_address** (`Optional`[`str`]) – Receiver address
  * **start_date** (`Optional`[`datetime`]) – Start date for filtering transactions
  * **end_date** (`Optional`[`datetime`]) – End date for filtering transactions
  * **start_block** (`Optional`[`int`]) – Start block number for filtering transactions
  * **end_block** (`Optional`[`int`]) – End block number for filtering transactions
  * **method** (`Optional`[`str`]) – Method name to filter transactions
  * **escrow** (`Optional`[`str`]) – Escrow address to filter transactions
  * **token** (`Optional`[`str`]) – Token address to filter transactions
  * **first** (`int`) – Number of items per page
  * **skip** (`int`) – Page number to retrieve
  * **order** – Order of results, “asc” or “desc”
* **Raises:**
  **ValueError** – If start_date is after end_date

### *class* human_protocol_sdk.filter.WorkerFilter(chain_id, worker_address=None, order_by='payoutCount', order_direction=OrderDirection.DESC, first=10, skip=0)

Bases: `object`

A class used to filter workers.

#### \_\_init_\_(chain_id, worker_address=None, order_by='payoutCount', order_direction=OrderDirection.DESC, first=10, skip=0)

Initializes a WorkerFilter instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Chain ID to request data
  * **worker_address** (`Optional`[`str`]) – Address to filter by
  * **order_by** (`Optional`[`str`]) – Property to order by, e.g., “payoutCount”
  * **order_direction** ([`OrderDirection`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.OrderDirection)) – Order direction of results, “asc” or “desc”
  * **first** (`int`) – Number of items per page
  * **skip** (`int`) – Number of items to skip (for pagination)
