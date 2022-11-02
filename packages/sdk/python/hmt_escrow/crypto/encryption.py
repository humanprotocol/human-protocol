"""
The MIT License (MIT)

Copyright 2017-2019 Ethereum Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Source: https://github.com/ethereum/trinity/blob/master/p2p/ecies.py
"""
import hashlib
import os
import struct
import typing as t

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

from . import exceptions


class Encryption:
    """
    Encryption class specialized in encrypting and decrypting a byte string.
    """

    ELLIPTIC_CURVE: ec.EllipticCurve = ec.SECP256K1()
    """ Elliptic curve definition. """

    KEY_LEN = 32
    """ ECIES using AES256 and HMAC-SHA-256-32 """

    CIPHER = AES
    """ Cipher algorithm defintion. """

    MODE = CTR
    """ Cipher mode definition. """

    PUBLIC_KEY_LEN: int = 64
    """
    Length of public keys: 512 bit keys in uncompressed form, without
    format byte
    """

    @staticmethod
    def is_encrypted(data: bytes) -> bool:
        """
        Checks whether data is already encrypted by verifying ecies header.
        """
        return data[:1] == b"\x04"

    def encrypt(
        self,
        data: bytes,
        public_key: eth_datatypes.PublicKey,
        shared_mac_data: bytes = b"",
    ) -> bytes:
        """
        Encrypt data with ECIES method to the given public key
        1) generate r = random value
        2) generate shared-secret = kdf( ecdhAgree(r, P) )
        3) generate R = rG [same op as generating a public key]
        4) 0x04 || R || AsymmetricEncrypt(shared-secret, plaintext) || tag

        Args:
            data (bytes): Data to be encrypted
            public_key (eth_datatypes.PublicKey): Public to be used to encrypt
                provided data.
            shared_mac_data (bytes): shared mac additional data as suffix.
        Returns:
            bytes: Encrypted byte string
        """
        # 1) generate r = random value
        ephemeral = self.generate_private_key()

        # 2) generate shared-secret = key_derivation( key_exchange(r, P) )
        try:
            key_material = self._process_key_exchange(ephemeral, public_key)
        except exceptions.InvalidPublicKey as exc:
            raise exceptions.DecryptionError(
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
        """
        Decrypt data with ECIES method using the given private key
        1) generate shared-secret = kdf( ecdhAgree(myPrivKey, msg[1:65]) )
        2) verify tag
        3) decrypt
        ecdhAgree(r, recipientPublic) == ecdhAgree(recipientPrivate, R)
        [where R = r*G, and recipientPublic = recipientPrivate*G]

        Args:
            data (bytes): Data to be decrypted
            private_key (eth_datatypes.PrivateKey):  Private key to be used in
                agreement.
            shared_mac_data (bytes): shared mac additional data as suffix.
        Returns:

        """
        if self.is_encrypted(data) is False:
            raise exceptions.DecryptionError("wrong ecies header")

        #  1) generate shared-secret = kdf( ecdhAgree(myPrivKey, msg[1:65]) )
        shared = data[1 : 1 + self.PUBLIC_KEY_LEN]

        try:
            key_material = self._process_key_exchange(
                private_key, eth_keys.PublicKey(shared)
            )
        except exceptions.InvalidPublicKey as exc:
            raise exceptions.DecryptionError(
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
            raise exceptions.DecryptionError("Failed to verify tag")

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
        """
        Performs a key exchange operation using the
        ECDH (Elliptic-curve Diffie–Hellman) algorithm.

        NIST SP 800-56a Concatenation Key Derivation Function
        (see section 4) - Key agreement.
        https://csrc.nist.gov/CSRC/media/Publications/sp/800-56a/archive/2006-05-03/documents/sp800-56-draft-jul2005.pdf


        A key establishment procedure where the resultant secret keying
        material is a function of information contributed by two participants,
        so that no party can predetermine the value of the secret keying
        material independently from the contribut ions of the other parties.
        Contrast with key transport.  

        Args:
            private_key (eth_datatypes.PrivateKey): Private key to be used in
                agreement (the initiator).
            public_key (eth_datatypes.PublicKey): Public key to be exchanged
                (responder).

        Returns:
            Key material resulted of the exchange between two keys, assuming
                that they derive the same key material
        """ ""
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
            raise exceptions.InvalidPublicKey(str(error)) from error

    def generate_private_key(self) -> eth_datatypes.PrivateKey:
        """Generates a new SECP256K1 private key and return it"""
        key = ec.generate_private_key(curve=self.ELLIPTIC_CURVE)
        big_key = int_to_big_endian(key.private_numbers().private_value)
        padded_key = self._pad32(big_key)
        return eth_keys.PrivateKey(padded_key)

    @staticmethod
    def generate_public_key(private_key: bytes) -> eth_keys.PublicKey:
        """
        Generates a public key with combination to private key provided.
        Args:
            private_key (bytes): Private to be used to create public key.

        Returns:
            Public key object.
        """
        private_key_obj = eth_keys.PrivateKey(private_key)
        return private_key_obj.public_key

    def _get_key_derivation(self, key_material: bytes) -> bytes:
        """
        NIST SP 800-56a Concatenation Key Derivation Function
        (see section 5.8.1) - KDF.

        An Approved key derivation function (KDF) shall be used to derive
        secret keying material from a shared secret.

        Pretty much copied from geth's implementation:
        https://github.com/ethereum/go-ethereum/blob/673007d7aed1d2678ea3277eceb7b55dc29cf092/crypto/ecies/ecies.go#L167

        Args:
            key_material (bytes): Key material derived from ECDH
                (shared secret) exchange and must be processed to deverive a
                key secret.

        Returns:
            Key secret derived - a called KDF

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
        """Generates hash MAC using SHA256 Hash Algorithm"""
        mac = hmac.HMAC(key, hashes.SHA256())
        mac.update(msg)
        return mac.finalize()

    @staticmethod
    def _pad32(value: bytes) -> bytes:
        """
        Args:
            value (bytes): Value to be add padding on the data.

        Returns:
            bytes: value with added code added.
        """
        return value.rjust(32, b"\x00")
