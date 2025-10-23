# human_protocol_sdk.utils module

### human_protocol_sdk.utils.apply_tx_defaults(w3, tx_options)

Apply network specific default transaction parameters.

Aurora networks enforce a fixed gas price. We always override any user supplied
gasPrice with DEFAULT_AURORA_GAS_PRICE when on Aurora Testnet.
EIP-1559 fields are removed to avoid conflicts.

* **Parameters:**
  * **w3** (`Web3`) – Web3 instance (used to read chain id)
  * **tx_options** (`Optional`[`TxParams`]) – Original transaction options (can be None)
* **Return type:**
  `TxParams`
* **Returns:**
  Mutated tx options with enforced defaults

### human_protocol_sdk.utils.get_contract_interface(contract_entrypoint)

Retrieve the contract interface of a given contract.

* **Parameters:**
  **contract_entrypoint** – the entrypoint of the JSON.
* **Returns:**
  The contract interface containing the contract abi.

### human_protocol_sdk.utils.get_data_from_subgraph(network, query, params=None)

Fetch data from the subgraph.

* **Parameters:**
  * **network** (`dict`) – Network configuration dictionary
  * **query** (`str`) – GraphQL query string
  * **params** (`Optional`[`dict`]) – Query parameters
* **Returns:**
  JSON response from the subgraph
* **Raises:**
  **Exception** – If the subgraph query fails

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

Get HMT balance

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

### human_protocol_sdk.utils.get_staking_interface()

Retrieve the Staking interface.

* **Returns:**
  The Staking interface of smart contract.

### human_protocol_sdk.utils.handle_error(e, exception_class)

Handles and translates errors raised during contract transactions.

This function captures exceptions (especially ContractLogicError from web3.py),
extracts meaningful revert reasons if present, logs unexpected errors, and raises
a custom exception with a clear message for SDK users.

* **Parameters:**
  * **e** – The exception object raised during a transaction.
  * **exception_class** – The custom exception class to raise (e.g., EscrowClientError).
* **Raises:**
  **exception_class** – With a detailed error message, including contract revert reasons if available.
* **Example:**
  try:
  : tx_hash = contract.functions.someMethod(…).transact()
    w3.eth.wait_for_transaction_receipt(tx_hash)

  except Exception as e:
  : handle_error(e, EscrowClientError)

### human_protocol_sdk.utils.parse_transfer_transaction(hmtoken_contract, tx_receipt)

Parse a transfer transaction receipt.

* **Parameters:**
  * **hmtoken_contract** (`Contract`) – The HMT token contract
  * **tx_receipt** (`Optional`[`TxReceipt`]) – The transaction receipt
* **Return type:**
  `Tuple`[`bool`, `Optional`[`int`]]
* **Returns:**
  A tuple indicating if HMT was transferred and the transaction balance

### human_protocol_sdk.utils.validate_json(data)

Validates if the given string is a valid JSON.
:type data: `str`
:param data: String to validate
:rtype: `bool`
:return: True if the string is a valid JSON, False otherwise

### human_protocol_sdk.utils.validate_url(url)

Validates the given URL.

* **Parameters:**
  **url** (`str`) – Public or private URL address
* **Return type:**
  `bool`
* **Returns:**
  True if URL is valid, False otherwise
* **Raises:**
  **ValidationFailure** – If the URL is invalid

### human_protocol_sdk.utils.with_retry(fn, retries=3, delay=5, backoff=2)

Retry a function

Mainly used with handle_transaction to retry on case of failure.
Uses exponential backoff.

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
