# human_protocol_sdk.utils module

### human_protocol_sdk.utils.get_contract_interface(contract_entrypoint)

Retrieve the contract interface of a given contract.

* **Parameters:**
  **contract_entrypoint** – the entrypoint of the JSON.
* **Returns:**
  The contract interface containing the contract abi.

### human_protocol_sdk.utils.get_data_from_subgraph(network, query, params=None)

### human_protocol_sdk.utils.get_erc20_interface()

Retrieve the ERC20 interface.

* **Returns:**
  The ERC20 interface of smart contract.

### human_protocol_sdk.utils.get_escrow_interface()

Retrieve the RewardPool interface.

* **Returns:**
  The RewardPool interface of smart contract.

### human_protocol_sdk.utils.get_factory_interface()

Retrieve the EscrowFactory interface.

* **Returns:**
  The EscrowFactory interface of smart contract.

### human_protocol_sdk.utils.get_hmt_balance(wallet_addr, token_addr, w3)

Get hmt balance

* **Parameters:**
  * **wallet_addr** – wallet address
  * **token_addr** – ERC-20 contract
  * **w3** – Web3 instance
* **Returns:**
  Decimal with HMT balance

### human_protocol_sdk.utils.get_kvstore_interface()

Retrieve the KVStore interface.

* **Returns:**
  The KVStore interface of smart contract.

### human_protocol_sdk.utils.get_reward_pool_interface()

Retrieve the RewardPool interface.

* **Returns:**
  The RewardPool interface of smart contract.

### human_protocol_sdk.utils.get_staking_interface()

Retrieve the Staking interface.

* **Returns:**
  The Staking interface of smart contract.

### human_protocol_sdk.utils.handle_transaction(w3, tx_name, tx, exception, tx_options)

Executes the transaction and waits for the receipt.

* **Parameters:**
  * **w3** (`Web3`) – Web3 instance
  * **tx_name** (`str`) – Name of the transaction
  * **tx** – Transaction object
  * **exception** (`Exception`) – Exception class to raise in case of error
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
    - If provided, can include values like ‘gas’, ‘gas_price’, ‘nonce’, etc
    - If ‘gas’ is not specified or is None, it will be estimated using tx.estimate_gas()
* **Returns:**
  The transaction receipt
* **Validate:**
  - There must be a default account

### human_protocol_sdk.utils.parse_transfer_transaction(hmtoken_contract, tx_receipt)

* **Return type:**
  `Tuple`[`bool`, `Optional`[`int`]]

### human_protocol_sdk.utils.validate_url(url)

Gets the url string.

* **Parameters:**
  **url** (`str`) – Public or private url address
* **Return type:**
  `bool`
* **Returns:**
  True if url is valid
* **Raises:**
  **ValidationFailure** – If the url is invalid

### human_protocol_sdk.utils.with_retry(fn, retries=3, delay=5, backoff=2)

Retry a function

Mainly used with handle_transaction to retry on case of failure.
Uses expnential backoff.

* **Parameters:**
  * **fn** – <Partial> to run with retry logic.
  * **retries** – number of times to retry the transaction
  * **delay** – time to wait (exponentially)
  * **backoff** – defines the rate of grow for the exponential wait.
* **Returns:**
  False if transaction never succeeded,
  otherwise the return of the function
* **Note:**
  If the partial returns a Boolean and it happens to be False,
  we would not know if the tx succeeded and it will retry.
