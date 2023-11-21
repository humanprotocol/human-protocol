# human_protocol_sdk package

## Subpackages

* [human_protocol_sdk.agreement package](human_protocol_sdk.agreement.md)
  * [Submodules](human_protocol_sdk.agreement.md#submodules)
  * [human_protocol_sdk.agreement.bootstrap module](human_protocol_sdk.agreement.md#module-human_protocol_sdk.agreement.bootstrap)
    * [`confidence_intervals()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.bootstrap.confidence_intervals)
  * [human_protocol_sdk.agreement.measures module](human_protocol_sdk.agreement.md#module-human_protocol_sdk.agreement.measures)
    * [`agreement()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.measures.agreement)
    * [`cohens_kappa()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.measures.cohens_kappa)
    * [`fleiss_kappa()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.measures.fleiss_kappa)
    * [`krippendorffs_alpha()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.measures.krippendorffs_alpha)
    * [`percentage()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.measures.percentage)
    * [`sigma()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.measures.sigma)
  * [human_protocol_sdk.agreement.utils module](human_protocol_sdk.agreement.md#module-human_protocol_sdk.agreement.utils)
    * [`NormalDistribution`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.utils.NormalDistribution)
      * [`NormalDistribution.__init__()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.utils.NormalDistribution.__init__)
      * [`NormalDistribution.cdf()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.utils.NormalDistribution.cdf)
      * [`NormalDistribution.pdf()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.utils.NormalDistribution.pdf)
      * [`NormalDistribution.ppf()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.utils.NormalDistribution.ppf)
    * [`confusion_matrix()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.utils.confusion_matrix)
    * [`label_counts()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.utils.label_counts)
    * [`observed_and_expected_differences()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.utils.observed_and_expected_differences)
    * [`records_from_annotations()`](human_protocol_sdk.agreement.md#human_protocol_sdk.agreement.utils.records_from_annotations)
  * [Module contents](human_protocol_sdk.agreement.md#module-human_protocol_sdk.agreement)

## Submodules

## human_protocol_sdk.constants module

### *class* human_protocol_sdk.constants.ChainId(value)

Bases: `Enum`

Enum for chain IDs.

#### AVALANCHE *= 43114*

#### AVALANCHE_TESTNET *= 43113*

#### BSC_MAINNET *= 56*

#### BSC_TESTNET *= 97*

#### CELO *= 42220*

#### CELO_ALFAJORES *= 44787*

#### GOERLI *= 5*

#### LOCALHOST *= 1338*

#### MAINNET *= 1*

#### MOONBASE_ALPHA *= 1287*

#### MOONBEAM *= 1284*

#### POLYGON *= 137*

#### POLYGON_MUMBAI *= 80001*

#### RINKEBY *= 4*

#### SKALE *= 1273227453*

### *class* human_protocol_sdk.constants.Role(value)

Bases: `Enum`

Enum for roles.

#### exchange_oracle *= 'Exchange Oracle'*

#### job_launcher *= 'Job Launcher'*

#### recording_oracle *= 'Recording Oracle'*

#### reputation_oracle *= 'Reputation Oracle'*

#### validator *= 'Validator'*

### *class* human_protocol_sdk.constants.Status(value)

Bases: `Enum`

Enum for escrow statuses.

#### Cancelled *= 5*

#### Complete *= 4*

#### Launched *= 0*

#### Paid *= 3*

#### Partial *= 2*

#### Pending *= 1*

## human_protocol_sdk.encryption module

### *class* human_protocol_sdk.encryption.Encryption(private_key_armored, passphrase=None)

Bases: `object`

A class that provides encryption and decryption functionality using PGP (Pretty Good Privacy).

#### \_\_init_\_(private_key_armored, passphrase=None)

Initializes an Encryption instance.

* **Parameters:**
  * **private_key_armored** (`str`) – Armored representation of the private key
  * **passphrase** (`Optional`[`str`]) – Passphrase to unlock the private key. Defaults to None.

#### decrypt(message, public_key=None)

Decrypts a message using the private key.

* **Parameters:**
  * **message** (`str`) – Armored message to decrypt
  * **public_key** (`Optional`[`str`]) – Armored public key used for signature verification. Defaults to None.
* **Return type:**
  `str`
* **Returns:**
  Decrypted message

#### sign(message)

Signs a message using the private key.

* **Parameters:**
  **message** (`str`) – Message to sign
* **Return type:**
  `str`
* **Returns:**
  Armored and signed message

#### sign_and_encrypt(message, public_keys)

Signs and encrypts a message using the private key and recipient’s public keys.

* **Parameters:**
  * **message** (`str`) – Message to sign and encrypt
  * **public_keys** (`List`[`str`]) – List of armored public keys of the recipients
* **Return type:**
  `str`
* **Returns:**
  Armored and signed/encrypted message

### *class* human_protocol_sdk.encryption.EncryptionUtils

Bases: `object`

A utility class that provides additional encryption-related functionalities.

#### *static* encrypt(message, public_keys)

Encrypts a message using the recipient’s public keys.

* **Parameters:**
  * **message** (`str`) – Message to encrypt
  * **public_keys** (`List`[`str`]) – List of armored public keys of the recipients
* **Return type:**
  `str`
* **Returns:**
  Armored and encrypted message

#### *static* get_signed_data(message)

Extracts the signed data from an armored signed message.

* **Parameters:**
  **message** (`str`) – Armored message
* **Return type:**
  `str`
* **Returns:**
  Extracted signed data

#### *static* verify(message, public_key)

Verifies the signature of a message using the corresponding public key.

* **Parameters:**
  * **message** (`str`) – Armored message to verify
  * **public_key** (`str`) – Armored public key
* **Return type:**
  `bool`
* **Returns:**
  True if the signature is valid, False otherwise

## human_protocol_sdk.escrow module

### *class* human_protocol_sdk.escrow.EscrowClient(web3, gas_limit=None)

Bases: `object`

A class used to manage escrow on the HUMAN network.

#### \_\_init_\_(web3, gas_limit=None)

Initializes a Escrow instance.

* **Parameters:**
  * **web3** (`Web3`) – The Web3 object
  * **gas_limit** (`Optional`[`int`]) – Gas limit to be provided to transaction

#### abort(escrow_address)

Cancels the specified escrow,
sends the balance to the canceler and selfdestructs the escrow contract.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow to abort
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### add_trusted_handlers(escrow_address, handlers)

Adds an array of addresses to the trusted handlers list.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow
  * **handlers** (`List`[`str`]) – Array of trusted handler addresses
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### bulk_payout(escrow_address, recipients, amounts, final_results_url, final_results_hash, txId)

Pays out the amounts specified to the workers and sets the URL of the final results file.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow
  * **recipients** (`List`[`str`]) – Array of recipient addresses
  * **amounts** (`List`[`Decimal`]) – Array of amounts the recipients will receive
  * **final_results_url** (`str`) – Final results file url
  * **final_results_hash** (`str`) – Final results file hash
  * **txId** (`Decimal`) – Serial number of the bulks
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### cancel(escrow_address)

Cancels the specified escrow and sends the balance to the canceler.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow to cancel
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### complete(escrow_address)

Sets the status of an escrow to completed.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow to complete
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### create_and_setup_escrow(token_address, trusted_handlers, job_requester_id, escrow_config)

Creates and sets up an escrow.

* **Parameters:**
  * **token_address** (`str`) – Token to use for pay outs
  * **trusted_handlers** (`List`[`str`]) – Array of addresses that can perform actions on the contract
  * **job_requester_id** (`str`) – The id of the job requester
  * **escrow_config** ([`EscrowConfig`](#human_protocol_sdk.escrow.EscrowConfig)) – Object containing all the necessary information to setup an escrow
* **Return type:**
  `str`
* **Returns:**
  The address of the escrow created
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### create_escrow(token_address, trusted_handlers, job_requester_id)

Creates an escrow contract that uses the token passed to pay oracle fees and reward workers.

* **Parameters:**
  * **tokenAddress** – The address of the token to use for payouts
  * **trusted_handlers** (`List`[`str`]) – Array of addresses that can perform actions on the contract
  * **job_requester_id** (`str`) – The id of the job requester
* **Return type:**
  `str`
* **Returns:**
  The address of the escrow created
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### fund(escrow_address, amount)

Adds funds to the escrow.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow to setup
  * **amount** (`Decimal`) – Amount to be added as funds
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_balance(escrow_address)

Gets the balance for a specified escrow address.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `Decimal`
* **Returns:**
  Value of the balance
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_exchange_oracle_address(escrow_address)

Gets the exchange oracle address of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Exchange oracle address
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_factory_address(escrow_address)

Gets the escrow factory address of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Escrow factory address
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_intermediate_results_url(escrow_address)

Gets the intermediate results file URL.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Intermediate results file url
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_job_launcher_address(escrow_address)

Gets the job launcher address of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Job launcher address
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_manifest_hash(escrow_address)

Gets the manifest file hash.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Manifest file hash
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_manifest_url(escrow_address)

Gets the manifest file URL.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return str:**
  Manifest file url
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters
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
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_reputation_oracle_address(escrow_address)

Gets the reputation oracle address of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Reputation oracle address
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_results_url(escrow_address)

Gets the results file URL.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Results file url
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_status(escrow_address)

Gets the current status of the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  [`Status`](#human_protocol_sdk.constants.Status)
* **Returns:**
  Current escrow status
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### get_token_address(escrow_address)

Gets the address of the token used to fund the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `str`
* **Returns:**
  Address of the token
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### setup(escrow_address, escrow_config)

Sets up the parameters of the escrow.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow to setup
  * **escrow_config** ([`EscrowConfig`](#human_protocol_sdk.escrow.EscrowConfig)) – Object containing all the necessary information to setup an escrow
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

#### store_results(escrow_address, url, hash)

Stores the results url.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow
  * **url** (`str`) – Results file url
  * **hash** (`str`) – Results file hash
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**EscrowClientError**](#human_protocol_sdk.escrow.EscrowClientError) – If an error occurs while checking the parameters

### *exception* human_protocol_sdk.escrow.EscrowClientError

Bases: `Exception`

Raises when some error happens when interacting with escrow.

### *class* human_protocol_sdk.escrow.EscrowConfig(recording_oracle_address, reputation_oracle_address, exchange_oracle_address, recording_oracle_fee, reputation_oracle_fee, exchange_oracle_fee, manifest_url, hash)

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

### *class* human_protocol_sdk.escrow.EscrowData(chain_id, id, address, amount_paid, balance, count, factory_address, launcher, status, token, total_funded_amount, created_at, final_results_url=None, intermediate_results_url=None, manifest_hash=None, manifest_url=None, recording_oracle=None, recording_oracle_fee=None, reputation_oracle=None, reputation_oracle_fee=None, exchange_oracle=None, exchange_oracle_fee=None)

Bases: `object`

#### \_\_init_\_(chain_id, id, address, amount_paid, balance, count, factory_address, launcher, status, token, total_funded_amount, created_at, final_results_url=None, intermediate_results_url=None, manifest_hash=None, manifest_url=None, recording_oracle=None, recording_oracle_fee=None, reputation_oracle=None, reputation_oracle_fee=None, exchange_oracle=None, exchange_oracle_fee=None)

Initializes an EscrowData instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](#human_protocol_sdk.constants.ChainId)) – Chain identifier
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
  * **manifest_url** (`Optional`[`str`]) – Manifest URL.
  * **recording_oracle** (`Optional`[`str`]) – Recording Oracle address.
  * **recording_oracle_fee** (`Optional`[`int`]) – Recording Oracle fee.
  * **reputation_oracle** (`Optional`[`str`]) – Reputation Oracle address.
  * **reputation_oracle_fee** (`Optional`[`int`]) – Reputation Oracle fee.
  * **exchange_oracle** (`Optional`[`str`]) – Exchange Oracle address.
  * **exchange_oracle_fee** (`Optional`[`int`]) – Exchange Oracle fee.

### *class* human_protocol_sdk.escrow.EscrowUtils

Bases: `object`

A utility class that provides additional escrow-related functionalities.

#### *static* get_escrow(chain_id, escrow_address)

Returns the escrow for a given address.

* **Parameters:**
  * **chain_id** ([`ChainId`](#human_protocol_sdk.constants.ChainId)) – Network in which the escrow has been deployed
  * **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `Optional`[[`EscrowData`](#human_protocol_sdk.escrow.EscrowData)]
* **Returns:**
  Escrow data

#### *static* get_escrows(filter=<human_protocol_sdk.filter.EscrowFilter object>)

Get an array of escrow addresses based on the specified filter parameters.

* **Parameters:**
  **filter** ([`EscrowFilter`](#human_protocol_sdk.filter.EscrowFilter)) – Object containing all the necessary parameters to filter
* **Return type:**
  `List`[[`EscrowData`](#human_protocol_sdk.escrow.EscrowData)]
* **Returns:**
  List of escrows

## human_protocol_sdk.filter module

### *class* human_protocol_sdk.filter.EscrowFilter(networks, launcher=None, reputation_oracle=None, recording_oracle=None, exchange_oracle=None, job_requester_id=None, status=None, date_from=None, date_to=None)

Bases: `object`

A class used to filter escrow requests.

#### \_\_init_\_(networks, launcher=None, reputation_oracle=None, recording_oracle=None, exchange_oracle=None, job_requester_id=None, status=None, date_from=None, date_to=None)

Initializes a EscrowFilter instance.

* **Parameters:**
  * **networks** (`List`[[`ChainId`](#human_protocol_sdk.constants.ChainId)]) – Networks to request data
  * **launcher** (`Optional`[`str`]) – Launcher address
  * **reputation_oracle** (`Optional`[`str`]) – Reputation oracle address
  * **recording_oracle** (`Optional`[`str`]) – Recording oracle address
  * **exchange_oracle** (`Optional`[`str`]) – Exchange oracle address
  * **job_requester_id** (`Optional`[`str`]) – Job requester id
  * **status** (`Optional`[[`Status`](#human_protocol_sdk.constants.Status)]) – Escrow status
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

## human_protocol_sdk.kvstore module

### *class* human_protocol_sdk.kvstore.KVStoreClient(web3, gas_limit=None)

Bases: `object`

A class used to manage kvstore on the HUMAN network.

#### \_\_init_\_(web3, gas_limit=None)

Initializes a KVStore instance.

* **Parameters:**
  **web3** (`Web3`) – The Web3 object

#### get(address, key)

Gets the value of a key-value pair in the contract.

* **Parameters:**
  * **address** (`str`) – The Ethereum address associated with the key-value pair
  * **key** (`str`) – The key of the key-value pair to get
* **Return type:**
  `str`
* **Returns:**
  The value of the key-value pair if it exists

#### get_url(address, key='url')

Gets the URL value of the given entity.

* **Parameters:**
  * **address** (`str`) – Address from which to get the URL value.
  * **key** (`Optional`[`str`]) – Configurable URL key. url by default.
* **Return url:**
  The URL value of the given address if exists, and the content is valid
* **Return type:**
  `str`

#### set(key, value)

Sets the value of a key-value pair in the contract.

* **Parameters:**
  * **key** (`str`) – The key of the key-value pair to set
  * **value** (`str`) – The value of the key-value pair to set
* **Return type:**
  `None`
* **Returns:**
  None

#### set_bulk(keys, values)

Sets multiple key-value pairs in the contract.

* **Parameters:**
  * **keys** (`List`[`str`]) – A list of keys to set
  * **values** (`List`[`str`]) – A list of values to set
* **Return type:**
  `None`
* **Returns:**
  None

#### set_url(url, key='url')

Sets a URL value for the address that submits the transaction.

* **Parameters:**
  **url** (`str`) – URL to set
* **Key:**
  Configurable URL key. url by default.
* **Return type:**
  `None`
* **Returns:**
  None
* **Raises:**
  [**KVStoreClientError**](#human_protocol_sdk.kvstore.KVStoreClientError) – If an error occurs while validating URL, or handling transaction

### *exception* human_protocol_sdk.kvstore.KVStoreClientError

Bases: `Exception`

Raises when some error happens when interacting with kvstore.

## human_protocol_sdk.legacy_encryption module

### *exception* human_protocol_sdk.legacy_encryption.DecryptionError

Bases: `Exception`

Raised when a message could not be decrypted.

### *class* human_protocol_sdk.legacy_encryption.Encryption

Bases: `object`

Encryption class specialized in encrypting and decrypting a byte string.

#### CIPHER

Cipher algorithm defintion.

alias of `AES`

#### ELLIPTIC_CURVE*: `EllipticCurve`* *= <cryptography.hazmat.primitives.asymmetric.ec.SECP256K1 object>*

Elliptic curve definition.

#### KEY_LEN *= 32*

ECIES using AES256 and HMAC-SHA-256-32

#### MODE

Cipher mode definition.

alias of `CTR`

#### PUBLIC_KEY_LEN*: `int`* *= 64*

Length of public keys: 512 bit keys in uncompressed form, without
format byte

#### decrypt(data, private_key, shared_mac_data=b'')

Decrypt data with ECIES method using the given private key
1) generate shared-secret = kdf( ecdhAgree(myPrivKey, msg[1:65]) )
2) verify tag
3) decrypt
ecdhAgree(r, recipientPublic) == ecdhAgree(recipientPrivate, R)
[where R = r\*G, and recipientPublic = recipientPrivate\*G]

* **Parameters:**
  * **data** (`bytes`) – Data to be decrypted
  * **private_key** (`PrivateKey`) – Private key to be used in agreement.
  * **shared_mac_data** (`bytes`) – shared mac additional data as suffix.
* **Return type:**
  `bytes`
* **Returns:**
  Decrypted byte string

#### encrypt(data, public_key, shared_mac_data=b'')

Encrypt data with ECIES method to the given public key
1) generate r = random value
2) generate shared-secret = kdf( ecdhAgree(r, P) )
3) generate R = rG [same op as generating a public key]
4) 0x04 || R || AsymmetricEncrypt(shared-secret, plaintext) || tag

* **Parameters:**
  * **data** (`bytes`) – Data to be encrypted
  * **public_key** (`PublicKey`) – Public to be used to encrypt provided data.
  * **shared_mac_data** (`bytes`) – shared mac additional data as suffix.
* **Return type:**
  `bytes`
* **Returns:**
  Encrypted byte string

#### generate_private_key()

Generates a new SECP256K1 private key and return it

* **Return type:**
  `PrivateKey`

#### *static* generate_public_key(private_key)

Generates a public key with combination to private key provided.

* **Parameters:**
  **private_key** (`bytes`) – Private to be used to create public key.
* **Return type:**
  `PublicKey`
* **Returns:**
  Public key object.

#### *static* is_encrypted(data)

Checks whether data is already encrypted by verifying ecies header.

* **Return type:**
  `bool`

### *exception* human_protocol_sdk.legacy_encryption.InvalidPublicKey

Bases: `Exception`

A custom exception raised when trying to convert bytes
into an elliptic curve public key.

## human_protocol_sdk.staking module

### *class* human_protocol_sdk.staking.AllocationData(escrow_address, staker, tokens, created_at, closed_at)

Bases: `object`

#### \_\_init_\_(escrow_address, staker, tokens, created_at, closed_at)

Initializes an AllocationData instance.

* **Parameters:**
  * **escrow_address** (`str`) – Escrow address
  * **staker** (`str`) – Staker address
  * **tokens** (`str`) – Amount allocated
  * **created_at** (`str`) – Creation date
  * **closed_at** (`str`) – Closing date

### *class* human_protocol_sdk.staking.LeaderData(chain_id, id, address, amount_staked, amount_allocated, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reputation, reward, amount_jobs_launched, role=None, fee=None, public_key=None, webhook_url=None, url=None)

Bases: `object`

#### \_\_init_\_(chain_id, id, address, amount_staked, amount_allocated, amount_locked, locked_until_timestamp, amount_withdrawn, amount_slashed, reputation, reward, amount_jobs_launched, role=None, fee=None, public_key=None, webhook_url=None, url=None)

Initializes an LeaderData instance.

* **Parameters:**
  * **chain_id** ([`ChainId`](#human_protocol_sdk.constants.ChainId)) – Chain Identifier
  * **id** (`str`) – Identifier
  * **address** (`str`) – Address
  * **amount_staked** (`int`) – Amount staked
  * **amount_allocated** (`int`) – Amount allocated
  * **amount_locked** (`int`) – Amount locked
  * **locked_until_timestamp** (`int`) – Locked until timestamp
  * **amount_withdrawn** (`int`) – Amount withdrawn
  * **amount_slashed** (`int`) – Amount slashed
  * **reputation** (`int`) – Reputation
  * **reward** (`int`) – Reward
  * **amount_jobs_launched** (`int`) – Amount of jobs launched
  * **role** (`Optional`[`str`]) – Role
  * **fee** (`Optional`[`int`]) – Fee
  * **public_key** (`Optional`[`str`]) – Public key
  * **webhook_url** (`Optional`[`str`]) – Webhook url
  * **url** (`Optional`[`str`]) – Url

### *class* human_protocol_sdk.staking.LeaderFilter(networks, role=None)

Bases: `object`

A class used to filter leaders.

#### \_\_init_\_(networks, role=None)

Initializes a LeaderFilter instance.

* **Parameters:**
  * **networks** (`List`[[`ChainId`](#human_protocol_sdk.constants.ChainId)]) – Networks to request data
  * **role** (`Optional`[`str`]) – Leader role

### *class* human_protocol_sdk.staking.RewardData(escrow_address, amount)

Bases: `object`

#### \_\_init_\_(escrow_address, amount)

Initializes an RewardData instance.

* **Parameters:**
  * **escrow_address** (`str`) – Escrow address
  * **amount** (`int`) – Amount

### *class* human_protocol_sdk.staking.StakingClient(w3)

Bases: `object`

A class used to manage staking, and allocation on the HUMAN network.

#### \_\_init_\_(w3)

Initializes a Staking instance

* **Parameters:**
  **w3** (`Web3`) – Web3 instance

#### allocate(escrow_address, amount)

Allocates HMT token to the escrow.

* **Parameters:**
  * **escrow_address** (`str`) – Address of the escrow
  * **amount** (`Decimal`) – Amount to allocate
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Amount must be greater than 0
  - Escrow address must be valid
  - Amount must be less than or equal to the staked amount (on-chain)

#### approve_stake(amount)

Approves HMT token for Staking.

* **Parameters:**
  **amount** (`Decimal`) – Amount to approve
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  Amount must be greater than 0

#### close_allocation(escrow_address)

Closes allocated HMT token from the escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Escrow address must be valid
  - Escrow should be cancelled / completed (on-chain)

#### distribute_reward(escrow_address)

Pays out rewards to the slashers for the specified escrow address.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Escrow address must be valid

#### get_allocation(escrow_address)

Gets the allocation info for the specified escrow.

* **Parameters:**
  **escrow_address** (`str`) – Address of the escrow
* **Return type:**
  `Optional`[[`AllocationData`](#human_protocol_sdk.staking.AllocationData)]
* **Returns:**
  Allocation info if escrow exists, otherwise None

#### slash(slasher, staker, escrow_address, amount)

Slashes HMT token.

* **Parameters:**
  * **slasher** (`str`) – Address of the slasher
  * **staker** (`str`) – Address of the staker
  * **escrow_address** (`str`) – Address of the escrow
  * **amount** (`Decimal`) – Amount to slash
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Amount must be greater than 0
  - Amount must be less than or equal to the amount allocated to the escrow (on-chain)
  - Escrow address must be valid

#### stake(amount)

Stakes HMT token.

* **Parameters:**
  **amount** (`Decimal`) – Amount to stake
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Amount must be greater than 0
  - Amount must be less than or equal to the approved amount (on-chain)
  - Amount must be less than or equal to the balance of the staker (on-chain)

#### unstake(amount)

Unstakes HMT token.

* **Parameters:**
  **amount** (`Decimal`) – Amount to unstake
* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - Amount must be greater than 0
  - Amount must be less than or equal to the staked amount which is not locked / allocated (on-chain)

#### withdraw()

Withdraws HMT token.

* **Return type:**
  `None`
* **Returns:**
  None
* **Validate:**
  - There must be unstaked tokens which is unlocked (on-chain)

### *exception* human_protocol_sdk.staking.StakingClientError

Bases: `Exception`

Raises when some error happens when interacting with staking.

### *class* human_protocol_sdk.staking.StakingUtils

Bases: `object`

A utility class that provides additional staking-related functionalities.

#### *static* get_leader(chain_id, leader_address)

Get the leader details.

* **Parameters:**
  * **chain_id** ([`ChainId`](#human_protocol_sdk.constants.ChainId)) – Network in which the leader exists
  * **leader_address** (`str`) – Address of the leader
* **Return type:**
  `Optional`[[`LeaderData`](#human_protocol_sdk.staking.LeaderData)]
* **Returns:**
  Leader data if exists, otherwise None

#### *static* get_leaders(filter=<human_protocol_sdk.staking.LeaderFilter object>)

Get leaders data of the protocol

* **Parameters:**
  **filter** ([`LeaderFilter`](#human_protocol_sdk.staking.LeaderFilter)) – Leader filter
* **Return type:**
  `List`[[`LeaderData`](#human_protocol_sdk.staking.LeaderData)]
* **Returns:**
  List of leaders data

#### *static* get_rewards_info(chain_id, slasher)

Get rewards of the given slasher

* **Parameters:**
  * **chain_id** ([`ChainId`](#human_protocol_sdk.constants.ChainId)) – Network in which the slasher exists
  * **slasher** (`str`) – Address of the slasher
* **Return type:**
  `List`[[`RewardData`](#human_protocol_sdk.staking.RewardData)]
* **Returns:**
  List of rewards info

## human_protocol_sdk.statistics module

### *class* human_protocol_sdk.statistics.DailyEscrowData(timestamp, escrows_total, escrows_pending, escrows_solved, escrows_paid, escrows_cancelled)

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

### *class* human_protocol_sdk.statistics.DailyHMTData(timestamp, total_transaction_amount, total_transaction_count)

Bases: `object`

A class used to specify daily HMT data.

#### \_\_init_\_(timestamp, total_transaction_amount, total_transaction_count)

Initializes a DailyHMTData instance.

* **Parameters:**
  * **timestamp** (`datetime`) – Timestamp
  * **total_transaction_amount** (`int`) – Total transaction amount
  * **total_transaction_count** (`int`) – Total transaction count

### *class* human_protocol_sdk.statistics.DailyPaymentData(timestamp, total_amount_paid, total_count, average_amount_per_worker)

Bases: `object`

A class used to specify daily payment data.

#### \_\_init_\_(timestamp, total_amount_paid, total_count, average_amount_per_worker)

Initializes a DailyPaymentData instance.

* **Parameters:**
  * **timestamp** (`datetime`) – Timestamp
  * **total_amount_paid** (`int`) – Total amount paid
  * **total_count** (`int`) – Total count
  * **average_amount_per_worker** (`int`) – Average amount per worker

### *class* human_protocol_sdk.statistics.DailyWorkerData(timestamp, active_workers)

Bases: `object`

A class used to specify daily worker data.

#### \_\_init_\_(timestamp, active_workers)

Initializes a DailyWorkerData instance.

* **Parameters:**
  * **timestamp** (`datetime`) – Timestamp
  * **active_workers** (`int`) – Active workers

### *class* human_protocol_sdk.statistics.EscrowStatistics(total_escrows, daily_escrows_data)

Bases: `object`

A class used to specify escrow statistics.

#### \_\_init_\_(total_escrows, daily_escrows_data)

Initializes a EscrowStatistics instance.

* **Parameters:**
  * **total_escrows** (`int`) – Total escrows
  * **daily_escrows_data** (`List`[[`DailyEscrowData`](#human_protocol_sdk.statistics.DailyEscrowData)]) – Daily escrows data

### *class* human_protocol_sdk.statistics.HMTHolder(address, balance)

Bases: `object`

A class used to specify HMT holder.

#### \_\_init_\_(address, balance)

Initializes a HMTHolder instance.

* **Parameters:**
  * **address** (`str`) – Holder address
  * **balance** (`int`) – Holder balance

### *class* human_protocol_sdk.statistics.HMTStatistics(total_transfer_amount, total_transfer_count, total_holders, holders, daily_hmt_data)

Bases: `object`

A class used to specify HMT statistics.

#### \_\_init_\_(total_transfer_amount, total_transfer_count, total_holders, holders, daily_hmt_data)

Initializes a HMTStatistics instance.

* **Parameters:**
  * **total_transfer_amount** (`int`) – Total transfer amount
  * **total_transfer_count** (`int`) – Total transfer count
  * **total_holders** (`int`) – Total holders
  * **holders** (`List`[[`HMTHolder`](#human_protocol_sdk.statistics.HMTHolder)]) – Holders
  * **daily_hmt_data** (`List`[[`DailyHMTData`](#human_protocol_sdk.statistics.DailyHMTData)]) – Daily HMT data

### *class* human_protocol_sdk.statistics.PaymentStatistics(daily_payments_data)

Bases: `object`

A class used to specify payment statistics.

#### \_\_init_\_(daily_payments_data)

Initializes a PaymentStatistics instance.

* **Parameters:**
  **daily_payments_data** (`List`[[`DailyPaymentData`](#human_protocol_sdk.statistics.DailyPaymentData)]) – Daily payments data

### *class* human_protocol_sdk.statistics.StatisticsClient(chain_id=ChainId.POLYGON_MUMBAI)

Bases: `object`

A client used to get statistical data.

#### \_\_init_\_(chain_id=ChainId.POLYGON_MUMBAI)

Initializes a Statistics instance

* **Parameters:**
  **chain_id** ([`ChainId`](#human_protocol_sdk.constants.ChainId)) – Chain ID to get statistical data from

#### get_escrow_statistics(param=<human_protocol_sdk.statistics.StatisticsParam object>)

Get escrow statistics data for the given date range.

* **Parameters:**
  **param** ([`StatisticsParam`](#human_protocol_sdk.statistics.StatisticsParam)) – Object containing the date range
* **Return type:**
  [`EscrowStatistics`](#human_protocol_sdk.statistics.EscrowStatistics)
* **Returns:**
  Escrow statistics data

#### get_hmt_statistics(param=<human_protocol_sdk.statistics.StatisticsParam object>)

Get HMT statistics data for the given date range.

* **Parameters:**
  **param** ([`StatisticsParam`](#human_protocol_sdk.statistics.StatisticsParam)) – Object containing the date range
* **Return type:**
  [`HMTStatistics`](#human_protocol_sdk.statistics.HMTStatistics)
* **Returns:**
  HMT statistics data

#### get_payment_statistics(param=<human_protocol_sdk.statistics.StatisticsParam object>)

Get payment statistics data for the given date range.

* **Parameters:**
  **param** ([`StatisticsParam`](#human_protocol_sdk.statistics.StatisticsParam)) – Object containing the date range
* **Return type:**
  [`PaymentStatistics`](#human_protocol_sdk.statistics.PaymentStatistics)
* **Returns:**
  Payment statistics data

#### get_worker_statistics(param=<human_protocol_sdk.statistics.StatisticsParam object>)

Get worker statistics data for the given date range.

* **Parameters:**
  **param** ([`StatisticsParam`](#human_protocol_sdk.statistics.StatisticsParam)) – Object containing the date range
* **Return type:**
  [`WorkerStatistics`](#human_protocol_sdk.statistics.WorkerStatistics)
* **Returns:**
  Worker statistics data

### *exception* human_protocol_sdk.statistics.StatisticsClientError

Bases: `Exception`

Raises when some error happens when getting data from subgraph.

### *class* human_protocol_sdk.statistics.StatisticsParam(date_from=None, date_to=None, limit=None)

Bases: `object`

A class used to specify statistics params.

#### \_\_init_\_(date_from=None, date_to=None, limit=None)

Initializes a StatisticsParam instance.

* **Parameters:**
  * **date_from** (`Optional`[`datetime`]) – Statistical data from date
  * **date_to** (`Optional`[`datetime`]) – Statistical data to date
  * **limit** (`Optional`[`int`]) – Limit of statistical data

### *class* human_protocol_sdk.statistics.WorkerStatistics(daily_workers_data)

Bases: `object`

A class used to specify worker statistics.

#### \_\_init_\_(daily_workers_data)

Initializes a WorkerStatistics instance.

* **Parameters:**
  **daily_workers_data** (`List`[[`DailyWorkerData`](#human_protocol_sdk.statistics.DailyWorkerData)]) – Daily workers data

## human_protocol_sdk.storage module

### *class* human_protocol_sdk.storage.Credentials(access_key, secret_key)

Bases: `object`

A class to represent the credentials required to authenticate with an S3-compatible service.

Example:

```default
credentials = Credentials(
    access_key='my-access-key',
    secret_key='my-secret-key'
)
```

#### \_\_init_\_(access_key, secret_key)

Initializes a Credentials instance.

* **Parameters:**
  * **access_key** (`str`) – The access key for the S3-compatible service.
  * **secret_key** (`str`) – The secret key for the S3-compatible service.

### *class* human_protocol_sdk.storage.StorageClient(endpoint_url, region=None, credentials=None, secure=True)

Bases: `object`

A class for downloading files from an S3-compatible service.

* **Attribute:**
  - client (Minio): The S3-compatible client used for interacting with the service.

Example:

```default
# Download a list of files from an S3-compatible service
client = StorageClient(
    endpoint_url='https://s3.us-west-2.amazonaws.com',
    region='us-west-2',
    credentials=Credentials(
        access_key='my-access-key',
        secret_key='my-secret-key'
    )
)
files = ['file1.txt', 'file2.txt']
bucket = 'my-bucket'
result_files = client.download_files(files=files, bucket=bucket)
```

#### \_\_init_\_(endpoint_url, region=None, credentials=None, secure=True)

Initializes the StorageClient with the given endpoint_url, region, and credentials.

If credentials are not provided, anonymous access will be used.

* **Parameters:**
  * **endpoint_url** (`str`) – The URL of the S3-compatible service.
  * **region** (`Optional`[`str`]) – The region of the S3-compatible service. Defaults to None.
  * **credentials** (`Optional`[[`Credentials`](#human_protocol_sdk.storage.Credentials)]) – The credentials required to authenticate with the S3-compatible service.
    Defaults to None for anonymous access.
  * **secure** (`Optional`[`bool`]) – Flag to indicate to use secure (TLS) connection to S3 service or not.
    Defaults to True.

#### bucket_exists(bucket)

Check if a given bucket exists.

* **Parameters:**
  **bucket** (`str`) – The name of the bucket to check.
* **Return type:**
  `bool`
* **Returns:**
  True if the bucket exists, False otherwise.
* **Raises:**
  [**StorageClientError**](#human_protocol_sdk.storage.StorageClientError) – If an error occurs while checking the bucket.

#### *static* download_file_from_url(url)

Downloads a file from the specified URL.

* **Parameters:**
  **url** (`str`) – The URL of the file to download.
* **Return type:**
  `bytes`
* **Returns:**
  The content of the downloaded file.
* **Raises:**
  [**StorageClientError**](#human_protocol_sdk.storage.StorageClientError) – If an error occurs while downloading the file.

#### download_files(files, bucket)

Downloads a list of files from the specified S3-compatible bucket.

* **Parameters:**
  * **files** (`List`[`str`]) – A list of file keys to download.
  * **bucket** (`str`) – The name of the S3-compatible bucket to download from.
* **Return type:**
  `List`[`bytes`]
* **Returns:**
  A list of file contents (bytes) downloaded from the bucket.
* **Raises:**
  * [**StorageClientError**](#human_protocol_sdk.storage.StorageClientError) – If an error occurs while downloading the files.
  * [**StorageFileNotFoundError**](#human_protocol_sdk.storage.StorageFileNotFoundError) – If one of the specified files is not found in the bucket.

#### list_objects(bucket)

Return a list of all objects in a given bucket.

* **Parameters:**
  **bucket** (`str`) – The name of the bucket to list objects from.
* **Return type:**
  `List`[`str`]
* **Returns:**
  A list of object keys in the given bucket.
* **Raises:**
  [**StorageClientError**](#human_protocol_sdk.storage.StorageClientError) – If an error occurs while listing the objects.

#### upload_files(files, bucket)

Uploads a list of files to the specified S3-compatible bucket.

* **Parameters:**
  * **files** (`List`[`dict`]) – A list of files to upload.
  * **bucket** (`str`) – The name of the S3-compatible bucket to upload to.
* **Return type:**
  `List`[`dict`]
* **Returns:**
  List of dict with key, url, hash fields
* **Raises:**
  [**StorageClientError**](#human_protocol_sdk.storage.StorageClientError) – If an error occurs while uploading the files.

### *exception* human_protocol_sdk.storage.StorageClientError

Bases: `Exception`

Raises when some error happens when interacting with storage.

### *exception* human_protocol_sdk.storage.StorageFileNotFoundError

Bases: [`StorageClientError`](#human_protocol_sdk.storage.StorageClientError)

Raises when some error happens when file is not found by its key.

## human_protocol_sdk.utils module

### human_protocol_sdk.utils.get_contract_interface(contract_entrypoint)

Retrieve the contract interface of a given contract.

* **Parameters:**
  **contract_entrypoint** – the entrypoint of the JSON.
* **Returns:**
  The contract interface containing the contract abi.

### human_protocol_sdk.utils.get_data_from_subgraph(url, query, params=None)

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

### human_protocol_sdk.utils.handle_transaction(w3, tx_name, tx, exception, gas_limit=None)

Executes the transaction and waits for the receipt.

* **Parameters:**
  * **w3** (`Web3`) – Web3 instance
  * **tx_name** (`str`) – Name of the transaction
  * **tx** – Transaction object
  * **exception** (`Exception`) – Exception class to raise in case of error
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

## Module contents
