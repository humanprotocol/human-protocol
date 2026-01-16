"""
Legacy encryption utilities for backward compatibility.

This module provides deprecated encryption functionality maintained for backward
compatibility with older versions of the SDK. For new implementations, use the
``human_protocol_sdk.encryption`` module instead.

Warning:
    This module is deprecated and will be removed in a future version.
    Please migrate to ``human_protocol_sdk.encryption.Encryption`` and
    ``human_protocol_sdk.encryption.EncryptionUtils``.

Example:
    ```python
    # Deprecated - for backward compatibility only
    from human_protocol_sdk.legacy_encryption import LegacyEncryption

    # Recommended - use this instead
    from human_protocol_sdk.encryption import Encryption
    ```
"""

import warnings
import hashlib
import os
import struct
import typing as t
from typing import Optional, List, Union

from cryptography.hazmat.primitives import hashes, hmac
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.ciphers import Cipher
from cryptography.hazmat.primitives.ciphers.algorithms import AES
from cryptography.hazmat.primitives.ciphers.modes import CTR
from cryptography.hazmat.primitives.constant_time import bytes_eq
from eth_keys import (
    datatypes as eth_datatypes,
    keys as eth_keys,
)
from eth_utils import int_to_big_endian
from pgpy import PGPKey, PGPMessage
from pgpy.constants import SymmetricKeyAlgorithm
from pgpy.errors import PGPError


class InvalidPublicKey(Exception):
    """Exception raised when converting bytes into an elliptic curve public key fails."""

    pass


class DecryptionError(Exception):
    """Exception raised when a message could not be decrypted."""

    pass


class Encryption:
    """Encryption class specialized in encrypting and decrypting byte strings using ECIES.

    This class implements Elliptic Curve Integrated Encryption Scheme (ECIES) using
    SECP256K1 elliptic curve, AES256 cipher, and HMAC-SHA-256-32.

    Attributes:
        ELLIPTIC_CURVE (ec.EllipticCurve): SECP256K1 elliptic curve definition.
        KEY_LEN (int): Key length for ECIES (32 bytes for AES256 and HMAC-SHA-256-32).
        CIPHER: AES cipher algorithm definition.
        MODE: CTR cipher mode definition.
        PUBLIC_KEY_LEN (int): Length of public keys in uncompressed form (64 bytes).
    """

    ELLIPTIC_CURVE: ec.EllipticCurve = ec.SECP256K1()
    KEY_LEN = 32
    CIPHER = AES
    MODE = CTR
    PUBLIC_KEY_LEN: int = 64

    @staticmethod
    def is_encrypted(data: bytes) -> bool:
        """Check whether data is already encrypted by verifying ECIES header.

        Args:
            data (bytes): Data to be checked for encryption.

        Returns:
            ``True`` if data has valid ECIES header (starts with 0x04), ``False`` otherwise.

        Example:
            ```python
            from human_protocol_sdk.legacy_encryption import Encryption

            encrypted_hex = "0402f48d28d29ae3d681e4cbbe499be0803c2a9d94534d0a4501ab79fd531183fbd837a021c1c117f47737e71c430b9d33915615f68c8dcb5e2f4e4dda4c9415d20a8b5fad9770b14067f2dd31a141a8a8da1f56eb2577715409dbf3c39b9bfa7b90c1acd838fe147c95f0e1ca9359a4cfd52367a73a6d6c548b492faa"
            is_encrypted = Encryption.is_encrypted(bytes.fromhex(encrypted_hex))
            ```
        """
        return data[:1] == b"\x04"

    def encrypt(
        self,
        data: bytes,
        public_key: eth_datatypes.PublicKey,
        shared_mac_data: bytes = b"",
    ) -> bytes:
        """Encrypt data using ECIES method with the given public key.

        The encryption process follows these steps:
        1. Generate random ephemeral private key r
        2. Generate shared secret using ECDH key agreement
        3. Derive encryption and MAC keys from shared secret
        4. Generate ephemeral public key R = r*G
        5. Encrypt data using AES256-CTR
        6. Generate authentication tag using HMAC-SHA256
        7. Return: 0x04 || R || IV || ciphertext || tag

        Args:
            data (bytes): Data to be encrypted.
            public_key (eth_datatypes.PublicKey): Public key to encrypt data for.
            shared_mac_data (bytes): Additional data to include in MAC computation. Defaults to empty bytes.

        Returns:
            Encrypted message in ECIES format.

        Raises:
            DecryptionError: If key exchange fails or public key is invalid.

        Example:
            ```python
            from human_protocol_sdk.legacy_encryption import Encryption
            from eth_keys import datatypes

            public_key_hex = "0a1d228684bc8c8c7611df3264f04ebd823651acc46b28b3574d2e69900d5e34f04a26cf13237fa42ab23245b58060c239b356b0a276f57e8de1234c7100fcf9"
            public_key = datatypes.PublicKey(bytes.fromhex(public_key_hex))

            encryption = Encryption()
            encrypted = encryption.encrypt(b'your message', public_key)
            ```
        """

        # 1) generate r = random value
        ephemeral = self.generate_private_key()

        # 2) generate shared-secret = key_derivation( key_exchange(r, P) )
        try:
            key_material = self._process_key_exchange(ephemeral, public_key)
        except InvalidPublicKey as exc:
            raise DecryptionError(
                "Failed to generate shared secret with" f" pubkey {public_key!r}: {exc}"
            ) from exc

        key = self._get_key_derivation(key_material)

        k_len = self.KEY_LEN // 2
        key_enc, key_mac = key[:k_len], key[k_len:]

        key_mac = hashlib.sha256(key_mac).digest()

        # 3) generate R = rG [same op as generating a public key]
        ephem_pub_key = ephemeral.public_key

        # Encrypt
        algo = self.CIPHER(key_enc)
        block_size = os.urandom(algo.block_size // 8)

        cipher_context = Cipher(algo, self.MODE(block_size)).encryptor()
        ciphertext = cipher_context.update(data) + cipher_context.finalize()

        # 4) 0x04 || R || AsymmetricEncrypt(shared-secret, plaintext) || tag
        msg = b"\x04" + ephem_pub_key.to_bytes() + block_size + ciphertext

        # the MAC of a message (called the tag) as per SEC 1, 3.5.
        msg_start = 1 + self.PUBLIC_KEY_LEN
        tag = self._hmac_sha256(key_mac, msg[msg_start:] + shared_mac_data)
        return msg + tag

    def decrypt(
        self,
        data: bytes,
        private_key: eth_datatypes.PrivateKey,
        shared_mac_data: bytes = b"",
    ) -> bytes:
        """Decrypt data using ECIES method with the given private key.

        The decryption process follows these steps:
        1. Extract ephemeral public key R from message
        2. Generate shared secret using ECDH: ecdhAgree(privateKey, R)
        3. Derive encryption and MAC keys from shared secret
        4. Verify authentication tag
        5. Decrypt ciphertext using AES256-CTR

        Args:
            data (bytes): Encrypted message in ECIES format.
            private_key (eth_datatypes.PrivateKey): Private key to decrypt the data.
            shared_mac_data (bytes): Additional data used in MAC computation. Defaults to empty bytes.

        Returns:
            Decrypted plaintext data.

        Raises:
            DecryptionError: If ECIES header is invalid, tag verification fails,
                key exchange fails, or decryption fails.

        Example:
            ```python
            from human_protocol_sdk.legacy_encryption import Encryption
            from eth_keys import datatypes

            private_key_hex = "9822f95dd945e373300f8c8459a831846eda97f314689e01f7cf5b8f1c2298b3"
            encrypted_hex = "0402f48d28d29ae3d681e4cbbe499be0803c2a9d94534d0a4501ab79fd531183fbd837a021c1c117f47737e71c430b9d33915615f68c8dcb5e2f4e4dda4c9415d20a8b5fad9770b14067f2dd31a141a8a8da1f56eb2577715409dbf3c39b9bfa7b90c1acd838fe147c95f0e1ca9359a4cfd52367a73a6d6c548b492faa"

            private_key = datatypes.PrivateKey(bytes.fromhex(private_key_hex))
            encryption = Encryption()
            decrypted = encryption.decrypt(bytes.fromhex(encrypted_hex), private_key)
            ```
        """

        if self.is_encrypted(data) is False:
            raise DecryptionError("wrong ecies header")

        #  1) generate shared-secret = kdf( ecdhAgree(myPrivKey, msg[1:65]) )
        shared = data[1 : 1 + self.PUBLIC_KEY_LEN]

        try:
            key_material = self._process_key_exchange(
                private_key, eth_keys.PublicKey(shared)
            )
        except InvalidPublicKey as exc:
            raise DecryptionError(
                "Failed to generate shared secret with" f" pubkey {shared!r}: {exc}"
            ) from exc

        key = self._get_key_derivation(key_material)

        k_len = self.KEY_LEN // 2
        key_enc, key_mac = key[:k_len], key[k_len:]

        key_mac = hashlib.sha256(key_mac).digest()
        tag = data[-self.KEY_LEN :]

        # 2) Verify tag
        expected_tag = self._hmac_sha256(
            key_mac, data[1 + self.PUBLIC_KEY_LEN : -self.KEY_LEN] + shared_mac_data
        )

        # Whether same tag byte
        if not bytes_eq(expected_tag, tag):
            raise DecryptionError("Failed to verify tag")

        # 3) Decrypt
        algo = self.CIPHER(key_enc)
        block_size = algo.block_size // 8

        data_start = 1 + self.PUBLIC_KEY_LEN
        data_slice = data[data_start : data_start + block_size]

        cipher_context = Cipher(algo, self.MODE(data_slice)).decryptor()
        ciphertext = data[data_start + block_size : -self.KEY_LEN]

        return cipher_context.update(ciphertext) + cipher_context.finalize()

    def _process_key_exchange(
        self, private_key: eth_datatypes.PrivateKey, public_key: eth_datatypes.PublicKey
    ) -> bytes:
        """Perform ECDH key exchange operation.

        Implements NIST SP 800-56a Concatenation Key Derivation Function (section 4)
        for key agreement using ECDH (Elliptic-curve Diffie-Hellman) algorithm.

        Args:
            private_key (eth_datatypes.PrivateKey): Private key for the initiator.
            public_key (eth_datatypes.PublicKey): Public key for the responder.

        Returns:
            Shared secret key material resulting from the ECDH exchange.

        Raises:
            InvalidPublicKey: If the public key cannot be converted to a valid elliptic curve point.
        """

        private_key_int = int(t.cast(int, private_key))
        ec_private_key = ec.derive_private_key(private_key_int, self.ELLIPTIC_CURVE)

        public_key_bytes = b"\x04" + public_key.to_bytes()

        try:
            # either of these can raise a ValueError:
            elliptic_pub_nums = ec.EllipticCurvePublicKey.from_encoded_point(
                self.ELLIPTIC_CURVE, public_key_bytes
            )
            ec_pub_key = elliptic_pub_nums.public_numbers().public_key()

            return ec_private_key.exchange(ec.ECDH(), ec_pub_key)

        except ValueError as error:
            # Not all bytes can be made into valid public keys, see the warning
            # at https://cryptography.io/en/latest/hazmat/primitives/asymmetric/ec/
            # under EllipticCurvePublicNumbers(x, y)
            raise InvalidPublicKey(str(error)) from error

    def generate_private_key(self) -> eth_datatypes.PrivateKey:
        """Generate a new SECP256K1 private key.

        Returns:
            Newly generated SECP256K1 private key.

        Example:
            ```python
            from human_protocol_sdk.legacy_encryption import Encryption

            encryption = Encryption()
            private_key = encryption.generate_private_key()
            ```
        """

        key = ec.generate_private_key(curve=self.ELLIPTIC_CURVE)
        big_key = int_to_big_endian(key.private_numbers().private_value)
        padded_key = self._pad32(big_key)
        return eth_keys.PrivateKey(padded_key)

    @staticmethod
    def generate_public_key(private_key: bytes) -> eth_keys.PublicKey:
        """Generate a public key from the given private key.

        Args:
            private_key (bytes): Private key bytes to derive the public key from.

        Returns:
            Public key object corresponding to the private key.

        Example:
            ```python
            from human_protocol_sdk.legacy_encryption import Encryption

            private_key_hex = "9822f95dd945e373300f8c8459a831846eda97f314689e01f7cf5b8f1c2298b3"
            public_key = Encryption.generate_public_key(bytes.fromhex(private_key_hex))
            ```
        """

        private_key_obj = eth_keys.PrivateKey(private_key)
        return private_key_obj.public_key

    def _get_key_derivation(self, key_material: bytes) -> bytes:
        """Derive encryption and MAC keys from shared secret using KDF.

        Implements NIST SP 800-56a Concatenation Key Derivation Function (section 5.8.1).
        Uses SHA256 hash to derive secret keying material from ECDH shared secret.

        Args:
            key_material (bytes): Shared secret from ECDH key exchange.

        Returns:
            Derived key secret (concatenation of encryption key and MAC key).
        """

        key = b""
        hash_ = hashes.SHA256()

        reps = ((self.KEY_LEN + 7) * 8) / (hash_.block_size * 8)

        counter = 0
        while counter <= reps:
            counter += 1
            ctx = hashlib.sha256()
            ctx.update(struct.pack(">I", counter))
            ctx.update(key_material)
            key += ctx.digest()

        return key[: self.KEY_LEN]

    @staticmethod
    def _hmac_sha256(key: bytes, msg: bytes) -> bytes:
        """Generate HMAC using SHA256 hash algorithm.

        Args:
            key (bytes): HMAC key.
            msg (bytes): Message to authenticate.

        Returns:
            HMAC-SHA256 digest.
        """

        mac = hmac.HMAC(key, hashes.SHA256())
        mac.update(msg)
        return mac.finalize()

    @staticmethod
    def _pad32(value: bytes) -> bytes:
        """Pad value to 32 bytes with leading zeros.

        Args:
            value (bytes): Value to pad.

        Returns:
            Value padded to 32 bytes.
        """
        return value.rjust(32, b"\x00")
