# human_protocol_sdk.legacy_encryption module

Legacy version of encryption module.
Learn more about [encryption](human_protocol_sdk.encryption.md#human_protocol_sdk.encryption.Encryption).

### *exception* human_protocol_sdk.legacy_encryption.DecryptionError

Bases: `Exception`

Raised when a message could not be decrypted.

### *class* human_protocol_sdk.legacy_encryption.Encryption

Bases: `object`

Encryption class specialized in encrypting and decrypting a byte string.

#### CIPHER

Cipher algorithm defintion.

alias of `AES`

#### ELLIPTIC_CURVE *: `EllipticCurve`* *= <cryptography.hazmat.primitives.asymmetric.ec.SECP256K1 object>*

Elliptic curve definition.

#### KEY_LEN *= 32*

ECIES using AES256 and HMAC-SHA-256-32

#### MODE

Cipher mode definition.

alias of `CTR`

#### PUBLIC_KEY_LEN *: `int`* *= 64*

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
* **Example:**
  ```python
  from human_protocol_sdk.legacy_encryption import Encryption
  from eth_keys import datatypes

  private_key_str = "9822f95dd945e373300f8c8459a831846eda97f314689e01f7cf5b8f1c2298b3"
  encrypted_message_str = "0402f48d28d29ae3d681e4cbbe499be0803c2a9d94534d0a4501ab79fd531183fbd837a021c1c117f47737e71c430b9d33915615f68c8dcb5e2f4e4dda4c9415d20a8b5fad9770b14067f2dd31a141a8a8da1f56eb2577715409dbf3c39b9bfa7b90c1acd838fe147c95f0e1ca9359a4cfd52367a73a6d6c548b492faa"

  private_key = datatypes.PrivateKey(bytes.fromhex(private_key_str))

  encryption = Encryption()
  encrypted_message = encryption.decrypt(bytes.fromhex(encrypted_message_str), private_key)
  ```

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
* **Example:**
  ```python
  from human_protocol_sdk.legacy_encryption import Encryption
  from eth_keys import datatypes

  public_key_str = "0a1d228684bc8c8c7611df3264f04ebd823651acc46b28b3574d2e69900d5e34f04a26cf13237fa42ab23245b58060c239b356b0a276f57e8de1234c7100fcf9"

  public_key = datatypes.PublicKey(bytes.fromhex(private_key_str))

  encryption = Encryption()
  encrypted_message = encryption.encrypt(b'your message', public_key)
  ```

#### generate_private_key()

Generates a new SECP256K1 private key and return it

* **Return type:**
  `PrivateKey`
* **Returns:**
  New SECP256K1 private key.
* **Example:**
  ```python
  from human_protocol_sdk.legacy_encryption import Encryption

  encryption = Encryption()
  private_key = encryption.generate_private_key()
  ```

#### *static* generate_public_key(private_key)

Generates a public key with combination to private key provided.

* **Parameters:**
  **private_key** (`bytes`) – Private to be used to create public key.
* **Return type:**
  `PublicKey`
* **Returns:**
  Public key object.
* **Example:**
  ```python
  from human_protocol_sdk.legacy_encryption import Encryption

  private_key_str = "9822f95dd945e373300f8c8459a831846eda97f314689e01f7cf5b8f1c2298b3"

  public_key = Encryption.generate_public_key(bytes.fromhex(private_key_str))
  ```

#### *static* is_encrypted(data)

Checks whether data is already encrypted by verifying ecies header.

* **Parameters:**
  **data** (`bytes`) – Data to be checked.
* **Return type:**
  `bool`
* **Returns:**
  True if data is encrypted, False otherwise.
* **Example:**
  ```python
  from human_protocol_sdk.legacy_encryption import Encryption

  encrypted_message_str = "0402f48d28d29ae3d681e4cbbe499be0803c2a9d94534d0a4501ab79fd531183fbd837a021c1c117f47737e71c430b9d33915615f68c8dcb5e2f4e4dda4c9415d20a8b5fad9770b14067f2dd31a141a8a8da1f56eb2577715409dbf3c39b9bfa7b90c1acd838fe147c95f0e1ca9359a4cfd52367a73a6d6c548b492faa"

  is_encrypted = Encryption.is_encrypted(bytes.fromhex(encrypted_message_str))
  ```

### *exception* human_protocol_sdk.legacy_encryption.InvalidPublicKey

Bases: `Exception`

A custom exception raised when trying to convert bytes
into an elliptic curve public key.
