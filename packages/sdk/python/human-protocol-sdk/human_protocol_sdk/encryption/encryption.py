"""
This class allows to sign, verify, encrypt and
decrypt messages at all levels of escrow processing.

The algorithm includes the implementation of the
[PGP encryption algorithm](https://github.com/openpgpjs/openpgpjs)
multi-public key encryption on python.
Using the vanilla [ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519)
implementation Schnorr signatures for signature and
[curve25519](https://en.wikipedia.org/wiki/Curve25519) for encryption.
Learn [more](https://wiki.polkadot.network/docs/learn-cryptography).

Code Example
------------

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

Module
------
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
