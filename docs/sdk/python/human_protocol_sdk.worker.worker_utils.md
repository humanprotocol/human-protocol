# human_protocol_sdk.worker.worker_utils module

### *class* human_protocol_sdk.worker.worker_utils.WorkerData(id, address, total_amount_received, payout_count)

Bases: `object`

#### \_\_init_\_(id, address, total_amount_received, payout_count)

Initializes a WorkerData instance.

* **Parameters:**
  * **id** (`str`) – Worker ID
  * **address** (`str`) – Worker address
  * **total_amount_received** (`int`) – Total amount received by the worker
  * **payout_count** (`int`) – Number of payouts received by the worker

### *class* human_protocol_sdk.worker.worker_utils.WorkerUtils

Bases: `object`

A utility class that provides additional worker-related functionalities.

#### *static* get_worker(chain_id, worker_address)

Gets the worker details.

* **Parameters:**
  * **chain_id** ([`ChainId`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.ChainId)) – Network in which the worker exists
  * **worker_address** (`str`) – Address of the worker
* **Return type:**
  `Optional`[[`WorkerData`](#human_protocol_sdk.worker.worker_utils.WorkerData)]
* **Returns:**
  Worker data if exists, otherwise None

#### *static* get_workers(filter)

Get workers data of the protocol.

* **Parameters:**
  **filter** ([`WorkerFilter`](human_protocol_sdk.filter.md#human_protocol_sdk.filter.WorkerFilter)) – Worker filter
* **Return type:**
  `List`[[`WorkerData`](#human_protocol_sdk.worker.worker_utils.WorkerData)]
* **Returns:**
  List of workers data

### *exception* human_protocol_sdk.worker.worker_utils.WorkerUtilsError

Bases: `Exception`

Raised when an error occurs when getting data from subgraph.
