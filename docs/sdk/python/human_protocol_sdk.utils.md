# human_protocol_sdk.utils module

### *class* human_protocol_sdk.utils.SubgraphOptions(max_retries=None, base_delay=None, indexer_id=None)

Bases: `object`

Configuration for subgraph logic.

#### \_\_init_\_(max_retries=None, base_delay=None, indexer_id=None)

#### base_delay *: `Optional`[`int`]* *= None*

#### indexer_id *: `Optional`[`str`]* *= None*

#### max_retries *: `Optional`[`int`]* *= None*

### human_protocol_sdk.utils.custom_gql_fetch(network, query, params=None, options=None)

Fetch data from the subgraph with optional logic.

* **Parameters:**
  * **network** (`dict`) – Network configuration dictionary
  * **query** (`str`) – GraphQL query string
  * **params** (`Optional`[`dict`]) – Query parameters
  * **options** (`Optional`[[`SubgraphOptions`](#human_protocol_sdk.utils.SubgraphOptions)]) – Optional subgraph configuration
* **Returns:**
  JSON response from the subgraph
* **Raises:**
  **Exception** – If the subgraph query fails

### human_protocol_sdk.utils.get_contract_interface(contract_entrypoint)

Retrieve the contract interface of a given contract.

* **Parameters:**
  **contract_entrypoint** – the entrypoint of the JSON.
* **Returns:**
  The contract interface containing the contract abi.

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
  HMT balance (wei)

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

### human_protocol_sdk.utils.is_indexer_error(error)

Check if an error indicates that the indexer is down or not synced.
This function specifically checks for “bad indexers” errors from The Graph.

* **Parameters:**
  **error** (`Exception`) – The error to check
* **Return type:**
  `bool`
* **Returns:**
  True if the error indicates indexer issues

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
