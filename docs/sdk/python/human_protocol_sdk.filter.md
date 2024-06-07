# human_protocol_sdk.filter module

### *class* human_protocol_sdk.filter.EscrowFilter(networks, launcher=None, reputation_oracle=None, recording_oracle=None, exchange_oracle=None, job_requester_id=None, status=None, date_from=None, date_to=None)

Bases: `object`

A class used to filter escrow requests.

#### \_\_init_\_(networks, launcher=None, reputation_oracle=None, recording_oracle=None, exchange_oracle=None, job_requester_id=None, status=None, date_from=None, date_to=None)

Initializes a EscrowFilter instance.

* **Parameters:**
  * **networks** (`List`[[`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)]) – Networks to request data
  * **launcher** (`Optional`[`str`]) – Launcher address
  * **reputation_oracle** (`Optional`[`str`]) – Reputation oracle address
  * **recording_oracle** (`Optional`[`str`]) – Recording oracle address
  * **exchange_oracle** (`Optional`[`str`]) – Exchange oracle address
  * **job_requester_id** (`Optional`[`str`]) – Job requester id
  * **status** (`Optional`[[`Status`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.Status)]) – Escrow status
  * **date_from** (`Optional`[`datetime`]) – Created from date
  * **date_to** (`Optional`[`datetime`]) – Created to date

### *exception* human_protocol_sdk.filter.FilterError

Bases: `Exception`

Raises when some error happens when building filter object.

### *class* human_protocol_sdk.filter.PayoutFilter(escrow_address=None, recipient=None, date_from=None, date_to=None)

Bases: `object`

A class used to filter payout requests.

#### \_\_init_\_(escrow_address=None, recipient=None, date_from=None, date_to=None)

Initializes a PayoutFilter instance.

* **Parameters:**
  * **escrow_address** (`Optional`[`str`]) – Escrow address
  * **recipient** (`Optional`[`str`]) – Recipient address
  * **date_from** (`Optional`[`datetime`]) – Created from date
  * **date_to** (`Optional`[`datetime`]) – Created to date

### *class* human_protocol_sdk.filter.TransactionFilter(networks, from_address=None, to_address=None, start_date=None, end_date=None, start_block=None, end_block=None)

Bases: `object`

A class used to filter transactions.

#### \_\_init_\_(networks, from_address=None, to_address=None, start_date=None, end_date=None, start_block=None, end_block=None)

Initializes a TransactionsFilter instance.

* **Parameters:**
  * **networks** (`List`[[`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)]) – List of chain IDs to filter transactions from
  * **from_address** (`Optional`[`str`]) – Sender address
  * **to_address** (`Optional`[`str`]) – Receiver address
  * **start_date** (`Optional`[`datetime`]) – Start date for filtering transactions
  * **end_date** (`Optional`[`datetime`]) – End date for filtering transactions
  * **start_block** (`Optional`[`int`]) – Start block number for filtering transactions
  * **end_block** (`Optional`[`int`]) – End block number for filtering transactions
* **Raises:**
  **ValueError** – If start_date is after end_date
