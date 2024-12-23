# human_protocol_sdk.encryption.encryption module

This class allows to sign, verify, encrypt and
decrypt messages at all levels of escrow processing.

The algorithm includes the implementation of the
[PGP encryption algorithm]([https://github.com/openpgpjs/openpgpjs](https://github.com/openpgpjs/openpgpjs))
multi-public key encryption on python.
Using the vanilla [ed25519]([https://en.wikipedia.org/wiki/EdDSA#Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519))
implementation Schnorr signatures for signature and
[curve25519]([https://en.wikipedia.org/wiki/Curve25519](https://en.wikipedia.org/wiki/Curve25519)) for encryption.
Learn [more]([https://wiki.polkadot.network/docs/learn-cryptography](https://wiki.polkadot.network/docs/learn-cryptography)).

## Code Example

```python
from human_protocol_sdk.encryption import Encryption

private_key = """-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEZJ1mYRYJKwYBBAHaRw8BAQdAGLLi15zjuVhD4eUOYR5v40kDyRb3nrkh
0tO5pPNXBIkAAQCXERVkGLDJadkZ3yzerGQeJyxM0Xl5IaEWrzQsSCt/mwz7
zRRIdW1hbiA8aHVtYW5AaG10LmFpPsKMBBAWCgA+BQJknWZhBAsJBwgJEAyX
rIbvfPxlAxUICgQWAAIBAhkBAhsDAh4BFiEEGWQNXhKpp2hxuxetDJeshu98
/GUAAFldAP4/HVRKEso+QiphYxfAIPbCbrZ+xy6RTFAW0tdjpDQwJQD+P81w
74pFhmBFjb8Aio87M1lLRzLSXjEVpKEciGerkQjHXQRknWZhEgorBgEEAZdV
AQUBAQdA+/XEHJiIC5GtJPxgybd2TyJe5kzTyh0+uzwAgD33R3cDAQgHAAD/
brJ3/2P+H4wOTV25YBp+UVvE0MqiVrCLk5kBNJdpN8AQn8J4BBgWCAAqBQJk
nWZhCRAMl6yG73z8ZQIbDBYhBBlkDV4SqadocbsXrQyXrIbvfPxlAAC04QD+
Jyyd/rDd4bEuAvsHFQHK2HMC2r0OLVHdMjygPELEA+sBANNtHfc60ts3++D7
dhjPN+xEYS1/BntokSSwC8mi56AJ
=GMlv
-----END PGP PRIVATE KEY BLOCK-----"""
passphrase = "passphrase"

encryption = Encryption(private_key, passphrase)
```

## Module

### *class* human_protocol_sdk.encryption.encryption.Encryption(private_key_armored, passphrase=None)

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
  `bytes`
* **Returns:**
  Decrypted message
* **Example:**
  ```python
  from human_protocol_sdk.encryption import Encryption

  private_key = """-----BEGIN PGP PRIVATE KEY BLOCK-----

  xVgEZJ1mYRYJKwYBBAHaRw8BAQdAGLLi15zjuVhD4eUOYR5v40kDyRb3nrkh
  0tO5pPNXBIkAAQCXERVkGLDJadkZ3yzerGQeJyxM0Xl5IaEWrzQsSCt/mwz7
  zRRIdW1hbiA8aHVtYW5AaG10LmFpPsKMBBAWCgA+BQJknWZhBAsJBwgJEAyX
  rIbvfPxlAxUICgQWAAIBAhkBAhsDAh4BFiEEGWQNXhKpp2hxuxetDJeshu98
  /GUAAFldAP4/HVRKEso+QiphYxfAIPbCbrZ+xy6RTFAW0tdjpDQwJQD+P81w
  74pFhmBFjb8Aio87M1lLRzLSXjEVpKEciGerkQjHXQRknWZhEgorBgEEAZdV
  AQUBAQdA+/XEHJiIC5GtJPxgybd2TyJe5kzTyh0+uzwAgD33R3cDAQgHAAD/
  brJ3/2P+H4wOTV25YBp+UVvE0MqiVrCLk5kBNJdpN8AQn8J4BBgWCAAqBQJk
  nWZhCRAMl6yG73z8ZQIbDBYhBBlkDV4SqadocbsXrQyXrIbvfPxlAAC04QD+
  Jyyd/rDd4bEuAvsHFQHK2HMC2r0OLVHdMjygPELEA+sBANNtHfc60ts3++D7
  dhjPN+xEYS1/BntokSSwC8mi56AJ
  =GMlv
  -----END PGP PRIVATE KEY BLOCK-----"""

  passphrase = "passphrase"

  encryption = Encryption(private_key, passphrase)
  decrypted_message = encryption.decrypt(encrypted_message)
  ```

#### sign(message)

Signs a message using the private key.

* **Parameters:**
  **message** (`Union`[`str`, `bytes`]) – Message to sign
* **Return type:**
  `str`
* **Returns:**
  Armored and signed message
* **Example:**
  ```python
  from human_protocol_sdk.encryption import Encryption

  private_key = """-----BEGIN PGP PRIVATE KEY BLOCK-----

  xVgEZJ1mYRYJKwYBBAHaRw8BAQdAGLLi15zjuVhD4eUOYR5v40kDyRb3nrkh
  0tO5pPNXBIkAAQCXERVkGLDJadkZ3yzerGQeJyxM0Xl5IaEWrzQsSCt/mwz7
  zRRIdW1hbiA8aHVtYW5AaG10LmFpPsKMBBAWCgA+BQJknWZhBAsJBwgJEAyX
  rIbvfPxlAxUICgQWAAIBAhkBAhsDAh4BFiEEGWQNXhKpp2hxuxetDJeshu98
  /GUAAFldAP4/HVRKEso+QiphYxfAIPbCbrZ+xy6RTFAW0tdjpDQwJQD+P81w
  74pFhmBFjb8Aio87M1lLRzLSXjEVpKEciGerkQjHXQRknWZhEgorBgEEAZdV
  AQUBAQdA+/XEHJiIC5GtJPxgybd2TyJe5kzTyh0+uzwAgD33R3cDAQgHAAD/
  brJ3/2P+H4wOTV25YBp+UVvE0MqiVrCLk5kBNJdpN8AQn8J4BBgWCAAqBQJk
  nWZhCRAMl6yG73z8ZQIbDBYhBBlkDV4SqadocbsXrQyXrIbvfPxlAAC04QD+
  Jyyd/rDd4bEuAvsHFQHK2HMC2r0OLVHdMjygPELEA+sBANNtHfc60ts3++D7
  dhjPN+xEYS1/BntokSSwC8mi56AJ
  =GMlv
  -----END PGP PRIVATE KEY BLOCK-----"""

  passphrase = "passphrase"

  encryption = Encryption(private_key, passphrase)
  signed_message = await encryption.sign("MESSAGE")
  ```

#### sign_and_encrypt(message, public_keys)

Signs and encrypts a message using the private key and recipient’s public keys.

* **Parameters:**
  * **message** (`Union`[`str`, `bytes`]) – Message to sign and encrypt
  * **public_keys** (`List`[`str`]) – List of armored public keys of the recipients
* **Return type:**
  `str`
* **Returns:**
  Armored and signed/encrypted message
* **Example:**
  ```python
  from human_protocol_sdk.encryption import Encryption

  private_key = """-----BEGIN PGP PRIVATE KEY BLOCK-----

  xVgEZJ1mYRYJKwYBBAHaRw8BAQdAGLLi15zjuVhD4eUOYR5v40kDyRb3nrkh
  0tO5pPNXBIkAAQCXERVkGLDJadkZ3yzerGQeJyxM0Xl5IaEWrzQsSCt/mwz7
  zRRIdW1hbiA8aHVtYW5AaG10LmFpPsKMBBAWCgA+BQJknWZhBAsJBwgJEAyX
  rIbvfPxlAxUICgQWAAIBAhkBAhsDAh4BFiEEGWQNXhKpp2hxuxetDJeshu98
  /GUAAFldAP4/HVRKEso+QiphYxfAIPbCbrZ+xy6RTFAW0tdjpDQwJQD+P81w
  74pFhmBFjb8Aio87M1lLRzLSXjEVpKEciGerkQjHXQRknWZhEgorBgEEAZdV
  AQUBAQdA+/XEHJiIC5GtJPxgybd2TyJe5kzTyh0+uzwAgD33R3cDAQgHAAD/
  brJ3/2P+H4wOTV25YBp+UVvE0MqiVrCLk5kBNJdpN8AQn8J4BBgWCAAqBQJk
  nWZhCRAMl6yG73z8ZQIbDBYhBBlkDV4SqadocbsXrQyXrIbvfPxlAAC04QD+
  Jyyd/rDd4bEuAvsHFQHK2HMC2r0OLVHdMjygPELEA+sBANNtHfc60ts3++D7
  dhjPN+xEYS1/BntokSSwC8mi56AJ
  =GMlv
  -----END PGP PRIVATE KEY BLOCK-----"""

  passphrase = "passphrase"

  public_key2 = """-----BEGIN PGP PUBLIC KEY BLOCK-----

  xjMEZKKJZRYJKwYBBAHaRw8BAQdAiy9Cvf7Stb5uGaPWTxhk2kEWgwHI75PK
  JAN1Re+mZ/7NFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSiiWUE
  CwkHCAkQLJTUgF16PUcDFQgKBBYAAgECGQECGwMCHgEWIQRHZsSFAPBxClHV
  TEYslNSAXXo9RwAAUYYA+gJKoCHiEl/1AUNKZrWBmvS3J9BRAFgvGHFmUKSQ
  qvCJAP9+M55C/K0QjO1B9N14TPsnENaB0IIlvavhNUgKow9sBc44BGSiiWUS
  CisGAQQBl1UBBQEBB0DWVuH+76KUCwGbLNnrTAGxysoo6TWpkG1upYQvZztB
  cgMBCAfCeAQYFggAKgUCZKKJZQkQLJTUgF16PUcCGwwWIQRHZsSFAPBxClHV
  TEYslNSAXXo9RwAA0dMBAJ0cd1OM/yWJdaVQcPp4iQOFh7hAOZlcOPF2NTRr
  1AvDAQC4Xx6swMIiu2Nx/2JYXr3QdUO/tBtC/QvU8LPQETo9Cg==
  =4PJh
  -----END PGP PUBLIC KEY BLOCK-----"""

  public_key3 = """-----BEGIN PGP PUBLIC KEY BLOCK-----

  xjMEZKLMDhYJKwYBBAHaRw8BAQdAufXwhFItFe4j2IuTa3Yc4lZMNAxV/B+k
  X8mJ5PzqY4fNFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSizA4E
  CwkHCAkQsGTIZV9ne20DFQgKBBYAAgECGQECGwMCHgEWIQTviv8XOCeYpubG
  OoWwZMhlX2d7bQAAYAUA/35sTPhzQjm7uPpSTw2ahUfRijlxfKRWc5p36x0L
  NX+mAQCxwUgrbR2ngZOa5E+AQM8tyq8fh1qMvrM5hNeNRNf/Cc44BGSizA4S
  CisGAQQBl1UBBQEBB0D8B9TjjY+KyoYR9wUE1tCaCi1N4ZoGFKscey3H5y80
  AAMBCAfCeAQYFggAKgUCZKLMDgkQsGTIZV9ne20CGwwWIQTviv8XOCeYpubG
  OoWwZMhlX2d7bQAARg0BAMuQnhXzyIbbARtV3dobO7nw+VwCHVs9E7OtzLUi
  25TEAP4m0jWfjq8w+0dM9U+/+r1FqMk/q7RU8Ib8HJXUOMaGBw==
  =62qY
  -----END PGP PUBLIC KEY BLOCK-----"""

  encryption = Encryption(private_key, passphrase)
  encrypted_message = encryption.sign_and_encrypt(
      "your message", [public_key2, public_key3]
  )
  ```
