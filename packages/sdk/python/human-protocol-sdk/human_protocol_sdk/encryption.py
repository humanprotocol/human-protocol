"""
**Encryption utility to encrypt/decrypt and sign/verify messages and secure protocol.**

The algorithm includes the implementation of the
[PGP encryption algorithm](https://github.com/openpgpjs/openpgpjs)
multi-public key encryption on python.
Using the vanilla [ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519)
implementation Schnorr signatures for signature and
[curve25519](https://en.wikipedia.org/wiki/Curve25519) for encryption.
Learn [more](https://wiki.polkadot.network/docs/learn-cryptography).

A simple example
----------------

* Encryption

.. code-block:: python

    from human_protocol_sdk.encryption import Encryption

    private_key = \"\"\"-----BEGIN PGP PRIVATE KEY BLOCK-----

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
    -----END PGP PRIVATE KEY BLOCK-----\"\"\"
    passphrase = "passphrase"

    encryption = Encryption(private_key, passphrase)

* EncryptionUtils

.. code-block:: python

    from human_protocol_sdk.encryption import EncryptionUtils

    public_key2 = \"\"\"-----BEGIN PGP PUBLIC KEY BLOCK-----

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
    -----END PGP PUBLIC KEY BLOCK-----\"\"\"

    public_key3 = \"\"\"-----BEGIN PGP PUBLIC KEY BLOCK-----

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
    -----END PGP PUBLIC KEY BLOCK-----\"\"\"

    encrypted_message = EncryptionUtils.encrypt(
        "MESSAGE",
        [public_key2, public_key3]
    )
"""

from typing import Optional, List
from pgpy import PGPKey, PGPMessage
from pgpy.constants import SymmetricKeyAlgorithm
from pgpy.errors import PGPError


class Encryption:
    """
    A class that provides encryption and decryption functionality using PGP (Pretty Good Privacy).
    """

    def __init__(self, private_key_armored: str, passphrase: Optional[str] = None):
        """
        Initializes an Encryption instance.

        :param private_key_armored: Armored representation of the private key
        :param passphrase: Passphrase to unlock the private key. Defaults to None.
        """
        try:
            self.private_key, _ = PGPKey.from_blob(private_key_armored)
        except PGPError as e:
            raise ValueError("Invalid private key: {}".format(str(e)))

        if not self.private_key.is_unlocked:
            if passphrase:
                try:
                    with self.private_key.unlock(passphrase):
                        self.passphrase = passphrase

                except PGPError as e:
                    raise ValueError("Failed to unlock private key: {}".format(str(e)))
            else:
                raise ValueError("Private key locked. Passphrase needed")

    def sign_and_encrypt(self, message: str, public_keys: List[str]) -> str:
        """
        Signs and encrypts a message using the private key and recipient's public keys.

        :param message: Message to sign and encrypt
        :param public_keys: List of armored public keys of the recipients

        :return: Armored and signed/encrypted message

        :example:
            .. code-block:: python

                from human_protocol_sdk.encryption import Encryption

                private_key = \"\"\"-----BEGIN PGP PRIVATE KEY BLOCK-----

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
                -----END PGP PRIVATE KEY BLOCK-----\"\"\"

                passphrase = "passphrase"

                public_key2 = \"\"\"-----BEGIN PGP PUBLIC KEY BLOCK-----

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
                -----END PGP PUBLIC KEY BLOCK-----\"\"\"

                public_key3 = \"\"\"-----BEGIN PGP PUBLIC KEY BLOCK-----

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
                -----END PGP PUBLIC KEY BLOCK-----\"\"\"
                ```

                encryption = Encryption(private_key, passphrase)
                encrypted_message = encryption.sign_and_encrypt(
                    "your message", [public_key2, public_key3]
                )
        """
        pgp_message = PGPMessage.new(message)
        if not self.private_key.is_unlocked:
            try:
                with self.private_key.unlock(self.passphrase):
                    pgp_message |= self.private_key.sign(pgp_message)
            except PGPError as e:
                raise ValueError("Failed to unlock private key: {}".format(str(e)))
        else:
            pgp_message |= self.private_key.sign(pgp_message)

        cipher = SymmetricKeyAlgorithm.AES256
        sessionkey = cipher.gen_key()

        for public_key in public_keys:
            recipient_key, _ = PGPKey.from_blob(public_key)
            pgp_message = recipient_key.encrypt(pgp_message, sessionkey)

        del sessionkey
        return pgp_message.__str__()

    def decrypt(self, message: str, public_key: Optional[str] = None) -> str:
        """
        Decrypts a message using the private key.

        :param message: Armored message to decrypt
        :param public_key: Armored public key used for signature verification. Defaults to None.

        :return: Decrypted message

        :example:
            .. code-block:: python

                from human_protocol_sdk.encryption import Encryption

                private_key = \"\"\"-----BEGIN PGP PRIVATE KEY BLOCK-----

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
                -----END PGP PRIVATE KEY BLOCK-----\"\"\"

                passphrase = "passphrase"

                encryption = Encryption(private_key, passphrase)
                decrypted_message = encryption.decrypt(encrypted_message)
        """
        pgp_message = PGPMessage.from_blob(message)
        decrypted_message = ""
        try:
            if not self.private_key.is_unlocked:
                try:
                    with self.private_key.unlock(self.passphrase):
                        decrypted_message = self.private_key.decrypt(pgp_message)
                except PGPError as e:
                    raise ValueError("Failed to unlock private key: {}".format(str(e)))
            else:
                decrypted_message = self.private_key.decrypt(pgp_message)
            if public_key:
                public_key, _ = PGPKey.from_blob(public_key)
                public_key.verify(decrypted_message)

            return decrypted_message.message.__str__()
        except PGPError as e:
            if (
                decrypted_message
                and len(decrypted_message.signatures) > 0
                and str(e) == "No signatures to verify"
            ):
                raise ValueError(
                    "Failed to decrypt message: Could not find signature with this public key"
                )
            raise ValueError("Failed to decrypt message: {}".format(str(e)))

    def sign(self, message: str) -> str:
        """
        Signs a message using the private key.

        :param message: Message to sign

        :return: Armored and signed message

        :example:
            .. code-block:: python

                from human_protocol_sdk.encryption import Encryption

                private_key = \"\"\"-----BEGIN PGP PRIVATE KEY BLOCK-----

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
                -----END PGP PRIVATE KEY BLOCK-----\"\"\"

                passphrase = "passphrase"

                encryption = Encryption(private_key, passphrase)
                signed_message = await encryption.sign("MESSAGE")
        """
        message = PGPMessage.new(message, cleartext=True)
        if not self.private_key.is_unlocked:
            try:
                with self.private_key.unlock(self.passphrase):
                    message |= self.private_key.sign(message)
            except PGPError as e:
                raise ValueError("Failed to unlock private key: {}".format(str(e)))
        else:
            message |= self.private_key.sign(message)
        return message.__str__()


class EncryptionUtils:
    """
    A utility class that provides additional encryption-related functionalities.
    """

    @staticmethod
    def encrypt(message: str, public_keys: List[str]) -> str:
        """
        Encrypts a message using the recipient's public keys.

        :param message: Message to encrypt
        :param public_keys: List of armored public keys of the recipients

        :return: Armored and encrypted message

        :example:
            .. code-block:: python

                from human_protocol_sdk.encryption import EncryptionUtils

                public_key2 = \"\"\"-----BEGIN PGP PUBLIC KEY BLOCK-----

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
                -----END PGP PUBLIC KEY BLOCK-----\"\"\"

                public_key3 = \"\"\"-----BEGIN PGP PUBLIC KEY BLOCK-----

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
                -----END PGP PUBLIC KEY BLOCK-----\"\"\"
                ```

                encrypted_message = EncryptionUtils.encrypt(
                    "MESSAGE",
                    [public_key2, public_key3]
                )
        """
        pgp_message = PGPMessage.new(message)
        cipher = SymmetricKeyAlgorithm.AES256
        sessionkey = cipher.gen_key()

        for public_key in public_keys:
            recipient_key, _ = PGPKey.from_blob(public_key)
            pgp_message = recipient_key.encrypt(pgp_message, sessionkey)

        del sessionkey
        return pgp_message.__str__()

    @staticmethod
    def verify(message: str, public_key: str) -> bool:
        """
        Verifies the signature of a message using the corresponding public key.

        :param message: Armored message to verify
        :param public_key: Armored public key

        :return: True if the signature is valid, False otherwise

        :example:
            .. code-block:: python

                from human_protocol_sdk.encryption import Encryption, EncryptionUtils

                private_key3 = \"\"\"-----BEGIN PGP PRIVATE KEY BLOCK-----

                xYYEZKLMDhYJKwYBBAHaRw8BAQdAufXwhFItFe4j2IuTa3Yc4lZMNAxV/B+k
                X8mJ5PzqY4f+CQMISyqDKFlj2s/gu7LzRcFRveVbtXvQJ6lvwWEpUgkc0NAL
                HykIe1gLJhsoR+v5J5fXTYwDridyL4YPLJCp7yF1K3FtyOV8Cqg46N5ijbGd
                Gs0USHVtYW4gPGh1bWFuQGhtdC5haT7CjAQQFgoAPgUCZKLMDgQLCQcICRCw
                ZMhlX2d7bQMVCAoEFgACAQIZAQIbAwIeARYhBO+K/xc4J5im5sY6hbBkyGVf
                Z3ttAABgBQD/fmxM+HNCObu4+lJPDZqFR9GKOXF8pFZzmnfrHQs1f6YBALHB
                SCttHaeBk5rkT4BAzy3Krx+HWoy+szmE141E1/8Jx4sEZKLMDhIKKwYBBAGX
                VQEFAQEHQPwH1OONj4rKhhH3BQTW0JoKLU3hmgYUqxx7LcfnLzQAAwEIB/4J
                Awhl3IXvo7mhyuAZwgOcvaH1X9ijw5l/VffBLYBhtmEnvN62iNZPNashQL26
                GOhrAB/v5I1XLacKNrwNP47UVGl/jz014ZBYTPGabhGl2kVQwngEGBYIACoF
                AmSizA4JELBkyGVfZ3ttAhsMFiEE74r/FzgnmKbmxjqFsGTIZV9ne20AAEYN
                AQDLkJ4V88iG2wEbVd3aGzu58PlcAh1bPROzrcy1ItuUxAD+JtI1n46vMPtH
                TPVPv/q9RajJP6u0VPCG/ByV1DjGhgc=
                =uaJU
                -----END PGP PRIVATE KEY BLOCK-----\"\"\"

                passphrase = "passphrase"

                public_key = \"\"\"-----BEGIN PGP PUBLIC KEY BLOCK-----

                xjMEZJ1mYRYJKwYBBAHaRw8BAQdAGLLi15zjuVhD4eUOYR5v40kDyRb3nrkh
                0tO5pPNXBInNFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSdZmEE
                CwkHCAkQDJeshu98/GUDFQgKBBYAAgECGQECGwMCHgEWIQQZZA1eEqmnaHG7
                F60Ml6yG73z8ZQAAWV0A/j8dVEoSyj5CKmFjF8Ag9sJutn7HLpFMUBbS12Ok
                NDAlAP4/zXDvikWGYEWNvwCKjzszWUtHMtJeMRWkoRyIZ6uRCM44BGSdZmES
                CisGAQQBl1UBBQEBB0D79cQcmIgLka0k/GDJt3ZPIl7mTNPKHT67PACAPfdH
                dwMBCAfCeAQYFggAKgUCZJ1mYQkQDJeshu98/GUCGwwWIQQZZA1eEqmnaHG7
                F60Ml6yG73z8ZQAAtOEA/icsnf6w3eGxLgL7BxUBythzAtq9Di1R3TI8oDxC
                xAPrAQDTbR33OtLbN/vg+3YYzzfsRGEtfwZ7aJEksAvJouegCQ==
                =GU20
                -----END PGP PUBLIC KEY BLOCK-----\"\"\"

                encryption = Encryption(private_key3, passphrase)
                signed_message = encryption.sign("MESSAGE")

                is_valid = EncryptionUtils.verify(signed_message, public_key)
        """
        try:
            signed_message = (
                PGPMessage().from_blob(message) if isinstance(message, str) else message
            )
            public_key, _ = PGPKey.from_blob(public_key)
            public_key.verify(signed_message)
            return True
        except PGPError as e:
            return False

    @staticmethod
    def get_signed_data(message: str) -> str:
        """
        Extracts the signed data from an armored signed message.

        :param message: Armored message

        :return: Extracted signed data

        :example:
            .. code-block:: python

                from human_protocol_sdk.encryption import Encryption, EncryptionUtils

                private_key3 = \"\"\"-----BEGIN PGP PRIVATE KEY BLOCK-----

                xYYEZKLMDhYJKwYBBAHaRw8BAQdAufXwhFItFe4j2IuTa3Yc4lZMNAxV/B+k
                X8mJ5PzqY4f+CQMISyqDKFlj2s/gu7LzRcFRveVbtXvQJ6lvwWEpUgkc0NAL
                HykIe1gLJhsoR+v5J5fXTYwDridyL4YPLJCp7yF1K3FtyOV8Cqg46N5ijbGd
                Gs0USHVtYW4gPGh1bWFuQGhtdC5haT7CjAQQFgoAPgUCZKLMDgQLCQcICRCw
                ZMhlX2d7bQMVCAoEFgACAQIZAQIbAwIeARYhBO+K/xc4J5im5sY6hbBkyGVf
                Z3ttAABgBQD/fmxM+HNCObu4+lJPDZqFR9GKOXF8pFZzmnfrHQs1f6YBALHB
                SCttHaeBk5rkT4BAzy3Krx+HWoy+szmE141E1/8Jx4sEZKLMDhIKKwYBBAGX
                VQEFAQEHQPwH1OONj4rKhhH3BQTW0JoKLU3hmgYUqxx7LcfnLzQAAwEIB/4J
                Awhl3IXvo7mhyuAZwgOcvaH1X9ijw5l/VffBLYBhtmEnvN62iNZPNashQL26
                GOhrAB/v5I1XLacKNrwNP47UVGl/jz014ZBYTPGabhGl2kVQwngEGBYIACoF
                AmSizA4JELBkyGVfZ3ttAhsMFiEE74r/FzgnmKbmxjqFsGTIZV9ne20AAEYN
                AQDLkJ4V88iG2wEbVd3aGzu58PlcAh1bPROzrcy1ItuUxAD+JtI1n46vMPtH
                TPVPv/q9RajJP6u0VPCG/ByV1DjGhgc=
                =uaJU
                -----END PGP PRIVATE KEY BLOCK-----\"\"\"

                passphrase = "passphrase"

                public_key = \"\"\"-----BEGIN PGP PUBLIC KEY BLOCK-----

                xjMEZJ1mYRYJKwYBBAHaRw8BAQdAGLLi15zjuVhD4eUOYR5v40kDyRb3nrkh
                0tO5pPNXBInNFEh1bWFuIDxodW1hbkBobXQuYWk+wowEEBYKAD4FAmSdZmEE
                CwkHCAkQDJeshu98/GUDFQgKBBYAAgECGQECGwMCHgEWIQQZZA1eEqmnaHG7
                F60Ml6yG73z8ZQAAWV0A/j8dVEoSyj5CKmFjF8Ag9sJutn7HLpFMUBbS12Ok
                NDAlAP4/zXDvikWGYEWNvwCKjzszWUtHMtJeMRWkoRyIZ6uRCM44BGSdZmES
                CisGAQQBl1UBBQEBB0D79cQcmIgLka0k/GDJt3ZPIl7mTNPKHT67PACAPfdH
                dwMBCAfCeAQYFggAKgUCZJ1mYQkQDJeshu98/GUCGwwWIQQZZA1eEqmnaHG7
                F60Ml6yG73z8ZQAAtOEA/icsnf6w3eGxLgL7BxUBythzAtq9Di1R3TI8oDxC
                xAPrAQDTbR33OtLbN/vg+3YYzzfsRGEtfwZ7aJEksAvJouegCQ==
                =GU20
                -----END PGP PUBLIC KEY BLOCK-----\"\"\"

                encryption = Encryption(private_key3, passphrase)
                signed_message = encryption.sign("MESSAGE")

                result = EncryptionUtils.get_signed_data(signed_message)
        """
        try:
            signed_message = (
                PGPMessage().from_blob(message) if isinstance(message, str) else message
            )
            return signed_message.message.__str__()
        except PGPError as e:
            return False
