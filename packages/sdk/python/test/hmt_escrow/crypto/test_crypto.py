import json
import unittest

from hmt_escrow import crypto
from test.hmt_escrow.utils import manifest


class EncryptionServiceTest(unittest.TestCase):
    """Encryption Seric test."""

    def setUp(self) -> None:
        self.private_key = (
            b"ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
        )
        self.public_key = b"2dbc2c2c86052702e7c219339514b2e8bd4687ba1236c478ad41b43330b08488c12c8c1797aa181f3a4596a1bd8a0c18344ea44d6655f61fa73e56e743f79e0d"
        self.bad_public_key = b"74c81fe41b30f741b31185052664a10c3256e2f08bcfb20c8f54e733bef58972adcf84e4f5d70a979681fd39d7f7847d2c0d3b5d4aead806c4fec4d8534be114"

        self.manifest = manifest
        self.data = json.dumps(self.manifest.serialize())

    def test_encrypt(self):
        """Tests encryption of a data using a public key."""
        encrypted = crypto.encrypt(self.public_key, self.data)

        encryption = crypto.Encryption()
        self.assertEqual(encryption.is_encrypted(encrypted), True)

    def test_decrypt(self):
        """Testes decryption of a data using correct private key."""
        # Encrypted with a certain public key
        encrypted = crypto.encrypt(self.bad_public_key, self.data)

        with self.assertRaises(crypto.DecryptionError) as error:
            # using a private key which is not combinted to the public key used
            # to decrypt data
            crypto.decrypt(self.private_key, encrypted)

        self.assertEqual(str(error.exception), "Failed to verify tag")

        # Now encrypting and decrypting with correct keys
        encrypted = crypto.encrypt(self.public_key, self.data)
        decrypted = crypto.decrypt(self.private_key, encrypted)

        self.assertEqual(decrypted, self.data)

    def test_is_encrypted(self):
        """Tests verification whether some data is already encrypted."""
        data = "some data to be encrypted".encode("utf-8")
        self.assertEqual(crypto.is_encrypted(data), False)

        encrypted = crypto.encrypt(self.public_key, self.data)
        self.assertEqual(crypto.is_encrypted(encrypted), True)
