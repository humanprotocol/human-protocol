# human_protocol_sdk.escrow.escrow_client module

This client enables to perform actions on Escrow contracts and
obtain information from both the contracts and subgraph.

Internally, the SDK will use one network or another according to the network ID of the web3.
To use this client, you need to create Web3 instance, and configure default account,
as well as some middlewares.

## Code Example

* With Signer

```python
from eth_typing import URI
from web3 import Web3
from web3.middleware import construct_sign_and_send_raw_middleware
from web3.providers.auto import load_provider_from_uri

from human_protocol_sdk.escrow import EscrowClient

def get_w3_with_priv_key(priv_key: str):
    w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
    gas_payer = w3.eth.account.from_key(priv_key)
    w3.eth.default_account = gas_payer.address
    w3.middleware_onion.add(
        construct_sign_and_send_raw_middleware(gas_payer),
        "construct_sign_and_send_raw_middleware",
    )
    return (w3, gas_payer)

(w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
escrow_client = EscrowClient(w3)
```

* Without Signer (For read operations only)

```python
from eth_typing import URI
from web3 import Web3
from web3.providers.auto import load_provider_from_uri

from human_protocol_sdk.escrow import EscrowClient

w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
escrow_client = EscrowClient(w3)
```

## Module

### *class* human_protocol_sdk.escrow.escrow_client.EscrowCancel(tx_hash, amount_refunded)

Bases: `object`

#### \_\_init_\_(tx_hash, amount_refunded)

Represents the result of an escrow cancellation transaction.

* **Parameters:**
  * **tx_hash** (`str`) – The hash of the transaction that cancelled the escrow.
  * **amount_refunded** (`any`) – The amount refunded during the escrow cancellation.

### *class* human_protocol_sdk.escrow.escrow_client.EscrowClient(web3)

Bases: `object`

A client class to interact with the escrow smart contract.

#### \_\_init_\_(web3)

Initializes a Escrow instance.

* **Parameters:**
  **web3** (`Web3`) – The Web3 object

#### add_trusted_handlers(escrow_address, handlers, tx_options=None)

Adds an array of addresses to the trusted handlers list.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow
  * **handlers** (`List`[`str`]) – Array of trusted handler addresses
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  escrow_client = EscrowClient(w3)

  trusted_handlers = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  ]
  escrow_client.add_trusted_handlers(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
      trusted_handlers
  )
  ```

#### bulk_payout(escrow_address, recipients, amounts, final_results_url, final_results_hash, txId, force_complete=False, tx_options=None)

Pays out the amounts specified to the workers and sets the URL of the final results file.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow
  * **recipients** (`List`[`str`]) – Array of recipient addresses
  * **amounts** (`List`[`Decimal`]) – Array of amounts the recipients will receive
  * **final_results_url** (`str`) – Final results file URL
  * **final_results_hash** (`str`) – Final results file hash
  * **txId** (`Decimal`) – Serial number of the bulks
  * **force_complete** (`Optional`[`bool`]) – (Optional) Indicates if remaining balance should be transferred to the escrow creator
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  escrow_client = EscrowClient(w3)

  recipients = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92267'
  ]
  amounts = [
      Web3.to_wei(5, 'ether'),
      Web3.to_wei(10, 'ether')
  ]
  results_url = 'http://localhost/results.json'
  results_hash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079'

  escrow_client.bulk_payout(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
      recipients,
      amounts,
      results_url,
      results_hash,
      1
  )
  ```

#### cancel(escrow_address, tx_options=None)

Cancels the specified escrow and sends the balance to the canceler.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow to cancel
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  [`EscrowCancel`](#human_protocol_sdk.escrow.escrow_client.EscrowCancel)
* **Returns:**
  EscrowCancel:
  An instance of the EscrowCancel class containing details of the cancellation transaction,
  including the transaction hash and the amount refunded.
* **Raises:**
  * [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
  * [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If the transfer event associated with the cancellation
    is not found in the transaction logs
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  escrow_client = EscrowClient(w3)

  escrow_cancel_data = escrow_client.cancel(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### complete(escrow_address, tx_options=None)

Sets the status of an escrow to completed.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow to complete
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  escrow_client = EscrowClient(w3)

  escrow_client.complete("0x62dD51230A30401C455c8398d06F85e4EaB6309f")
  ```

#### create_bulk_payout_transaction(escrow_address, recipients, amounts, final_results_url, final_results_hash, txId, force_complete=False, tx_options=None)

Creates a prepared transaction for bulk payout without signing or sending it.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow
  * **recipients** (`List`[`str`]) – Array of recipient addresses
  * **amounts** (`List`[`Decimal`]) – Array of amounts the recipients will receive
  * **final_results_url** (`str`) – Final results file URL
  * **final_results_hash** (`str`) – Final results file hash
  * **txId** (`Decimal`) – Serial number of the bulks
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `TxParams`
* **Returns:**
  A dictionary containing the prepared transaction
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  escrow_client = EscrowClient(w3)

  recipients = [
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92267'
  ]
  amounts = [
      Web3.to_wei(5, 'ether'),
      Web3.to_wei(10, 'ether')
  ]
  results_url = 'http://localhost/results.json'
  results_hash = 'b5dad76bf6772c0f07fd5e048f6e75a5f86ee079'

  transaction = escrow_client.create_bulk_payout_transaction(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
      recipients,
      amounts,
      results_url,
      results_hash,
      1,
      false
  )

  print(f"Transaction: {transaction}")

  signed_transaction = w3.eth.account.sign_transaction(
      transaction, private_key
  )
  tx_hash = w3.eth.send_raw_transaction(
      signed_transaction.raw_transaction
  )
  tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
  print(f"Transaction sent with hash: {tx_hash.hex()}")
  print(f"Transaction receipt: {tx_receipt}")
  ```

#### create_escrow(token_address, trusted_handlers, job_requester_id, tx_options=None)

Creates a new escrow contract.

* **Parameters:**
  * **token_address** (`str`) – Address of the token to be used in the escrow
  * **trusted_handlers** (`List`[`str`]) – List of trusted handler addresses
  * **job_requester_id** (`str`) – ID of the job requester
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Transaction options
* **Return type:**
  `str`
* **Returns:**
  Address of the created escrow contract
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(
          URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  escrow_client = EscrowClient(w3)

  token_address = '0x1234567890abcdef1234567890abcdef12345678'
  trusted_handlers = [
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef'
  ]
  job_requester_id = 'job-requester'
  escrow_address = escrow_client.create_escrow(
      token_address,
      trusted_handlers,
      job_requester_id
  )
  ```

#### ensure_correct_bulk_payout_input(escrow_address, recipients, amounts, final_results_url, final_results_hash)

Validates input parameters for bulk payout operations.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow
  * **recipients** (`List`[`str`]) – Array of recipient addresses
  * **amounts** (`List`[`Decimal`]) – Array of amounts the recipients will receive
  * **final_results_url** (`str`) – Final results file URL
  * **final_results_hash** (`str`) – Final results file hash
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If validation fails

#### fund(escrow_address, amount, tx_options=None)

Adds funds to the escrow.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow to fund
  * **amount** (`Decimal`) – Amount to be added as funds
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  escrow_client = EscrowClient(w3)

  amount = Web3.to_wei(5, 'ether')  # convert from ETH to WEI
  escrow_client.fund(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f", amount
  )
  ```

#### get_balance(escrow_address)

Gets the balance for a specified escrow address.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `Decimal`
* **Returns:**
  Value of the balance
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  balance = escrow_client.get_balance(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### get_exchange_oracle_address(escrow_address)

Gets the exchange oracle address of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Exchange oracle address
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  exchange_oracle = escrow_client.get_exchange_oracle_address(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### get_factory_address(escrow_address)

Gets the escrow factory address of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Escrow factory address
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  escrow_factory = escrow_client.get_factory_address(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### get_intermediate_results_url(escrow_address)

Gets the intermediate results file URL.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Intermediate results file url
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  url = escrow_client.get_intermediate_results_url(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### get_job_launcher_address(escrow_address)

Gets the job launcher address of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Job launcher address
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  job_launcher = escrow_client.get_job_launcher_address(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### get_manifest_hash(escrow_address)

Gets the manifest file hash.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Manifest file hash
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  manifest_hash = escrow_client.get_manifest_hash(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### get_manifest_url(escrow_address)

Gets the manifest file URL.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return str:**
  Manifest file url
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  url = escrow_client.get_manifest_url(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```
* **Return type:**
  `str`

#### get_recording_oracle_address(escrow_address)

Gets the recording oracle address of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Recording oracle address
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  recording_oracle = escrow_client.get_recording_oracle_address(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### get_reputation_oracle_address(escrow_address)

Gets the reputation oracle address of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Reputation oracle address
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  reputation_oracle = escrow_client.get_reputation_oracle_address(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### get_results_url(escrow_address)

Gets the results file URL.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Results file url
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  url = escrow_client.get_results_url(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### get_status(escrow_address)

Gets the current status of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  [`Status`](human_protocol_sdk.constants.md#human_protocol_sdk.constants.Status)
* **Returns:**
  Current escrow status
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  status = escrow_client.get_status(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### get_token_address(escrow_address)

Gets the address of the token used to fund the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Address of the token
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
  escrow_client = EscrowClient(w3)

  token_address = escrow_client.get_token_address(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f"
  )
  ```

#### setup(escrow_address, escrow_config, tx_options=None)

Sets up the parameters of the escrow.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow contract
  * **escrow_config** ([`EscrowConfig`](#human_protocol_sdk.escrow.escrow_client.EscrowConfig)) – Configuration parameters for the escrow
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Transaction options
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(
          URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  escrow_client = EscrowClient(w3)

  escrow_address = "0x1234567890abcdef1234567890abcdef12345678"
  escrow_config = EscrowConfig(
      recording_oracle_address='0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
      reputation_oracle_address='0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
      exchange_oracle_address='0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
      recording_oracle_fee=100,
      reputation_oracle_fee=100,
      exchange_oracle_fee=100,
      recording_oracle_url='https://example.com/recording',
      reputation_oracle_url='https://example.com/reputation',
      exchange_oracle_url='https://example.com/exchange',
      manifest_url='https://example.com/manifest',
      manifest_hash='0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef'
  )
  escrow_client.setup(
      escrow_address,
      escrow_config
  )
  ```
* **Return type:**
  `None`

#### store_results(escrow_address, url, hash, tx_options=None)

Stores the results URL.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow
  * **url** (`str`) – Results file URL
  * **hash** (`str`) – Results file hash
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  escrow_client = EscrowClient(w3)

  escrow_client.store_results(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
      "http://localhost/results.json",
      "b5dad76bf6772c0f07fd5e048f6e75a5f86ee079"
  )
  ```

#### withdraw(escrow_address, token_address, tx_options=None)

Withdraws additional tokens in the escrow to the canceler.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow to withdraw
  * **token_address** (`str`) – Address of the token to withdraw
  * **tx_options** (`Optional`[`TxParams`]) – (Optional) Additional transaction parameters
* **Return type:**
  [`EscrowWithdraw`](#human_protocol_sdk.escrow.escrow_client.EscrowWithdraw)
* **Returns:**
  EscrowWithdraw:
  An instance of the EscrowWithdraw class containing details of the withdrawal transaction,
  including the transaction hash and the token address and amount withdrawn.
* **Raises:**
  * [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If an error occurs while checking the parameters
  * [**EscrowClientError**](#human_protocol_sdk.escrow.escrow_client.EscrowClientError) – If the transfer event associated with the withdrawal
    is not found in the transaction logs
* **Example:**
  ```python
  from eth_typing import URI
  from web3 import Web3
  from web3.middleware import construct_sign_and_send_raw_middleware
  from web3.providers.auto import load_provider_from_uri

  from human_protocol_sdk.escrow import EscrowClient

  def get_w3_with_priv_key(priv_key: str):
      w3 = Web3(load_provider_from_uri(URI("http://localhost:8545")))
      gas_payer = w3.eth.account.from_key(priv_key)
      w3.eth.default_account = gas_payer.address
      w3.middleware_onion.add(
          construct_sign_and_send_raw_middleware(gas_payer),
          "construct_sign_and_send_raw_middleware",
      )
      return (w3, gas_payer)

  (w3, gas_payer) = get_w3_with_priv_key('YOUR_PRIVATE_KEY')
  escrow_client = EscrowClient(w3)

  escrow_cancel_data = escrow_client.withdraw(
      "0x62dD51230A30401C455c8398d06F85e4EaB6309f",
      "0x0376D26246Eb35FF4F9924cF13E6C05fd0bD7Fb4"
  )
  ```

### *exception* human_protocol_sdk.escrow.escrow_client.EscrowClientError

Bases: `Exception`

Raises when some error happens when interacting with escrow.

### *class* human_protocol_sdk.escrow.escrow_client.EscrowConfig(recording_oracle_address, reputation_oracle_address, exchange_oracle_address, recording_oracle_fee, reputation_oracle_fee, exchange_oracle_fee, manifest_url, hash)

Bases: `object`

A class used to manage escrow parameters.

#### \_\_init_\_(recording_oracle_address, reputation_oracle_address, exchange_oracle_address, recording_oracle_fee, reputation_oracle_fee, exchange_oracle_fee, manifest_url, hash)

Initializes a Escrow instance.

* **Parameters:**
  * **recording_oracle_address** (`str`) – Address of the Recording Oracle
  * **reputation_oracle_address** (`str`) – Address of the Reputation Oracle
  * **recording_oracle_fee** (`Decimal`) – Fee percentage of the Recording Oracle
  * **reputation_oracle_fee** (`Decimal`) – Fee percentage of the Reputation Oracle
  * **manifest_url** (`str`) – Manifest file url
  * **hash** (`str`) – Manifest file hash

### *class* human_protocol_sdk.escrow.escrow_client.EscrowWithdraw(tx_hash, token_address, amount_withdrawn)

Bases: `object`

#### \_\_init_\_(tx_hash, token_address, amount_withdrawn)

Represents the result of an escrow cancellation transaction.

* **Parameters:**
  * **tx_hash** (`str`) – The hash of the transaction associated with the escrow withdrawal.
  * **token_address** (`str`) – The address of the token used for the withdrawal.
  * **amount_withdrawn** (`any`) – The amount withdrawn from the escrow.
