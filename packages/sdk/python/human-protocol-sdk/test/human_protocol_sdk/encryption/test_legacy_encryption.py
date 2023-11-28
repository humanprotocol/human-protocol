import unittest

from human_protocol_sdk.legacy_encryption import Encryption, DecryptionError
from test.human_protocol_sdk.utils.encryption import message

from eth_keys import keys as eth_keys


class TestLegacyEncryption(unittest.TestCase):
    """Encryption Seric test."""

    def setUp(self) -> None:
        self.encryption = Encryption()
        self.private_key = self.encryption.generate_private_key()
        self.public_key = self.private_key.public_key

        # Alterantive private key to differ from the main one
        priv_key_alt = self.encryption.generate_private_key()
        # Let's take some other public key to test support for decryption.
        self.bad_public_key = priv_key_alt.public_key

        self.data = message.encode("utf-8")

    def test_private_key_generation(self):
        """Tests private key generation."""
        key = self.encryption.generate_private_key()
        self.assertIsInstance(key, eth_keys.PrivateKey)

    def test_generate_public_key_from_private_key(self):
        """Tests public key generated from a private key."""
        key = self.encryption.generate_private_key()
        key_bytes = key.to_bytes()

        pub_key = self.encryption.generate_public_key(key_bytes)
        self.assertIsInstance(pub_key, eth_keys.PublicKey)

    def test_is_encrypted(self):
        """Tests verification whether some data is already encrypted."""
        data = "some data to be encrypted".encode("utf-8")
        self.assertEqual(self.encryption.is_encrypted(data), False)

        encrypted = self.encryption.encrypt(data, self.public_key)
        self.assertEqual(self.encryption.is_encrypted(encrypted), True)

    def test_encrypt(self):
        """Tests encryption of a data using a public key."""
        encrypted = self.encryption.encrypt(self.data, self.public_key)
        self.assertEqual(self.encryption.is_encrypted(encrypted), True)

    def test_decrypt(self):
        """Testes decryption of a data using correct private key."""
        # Encrypted with a certain public key
        encrypted = self.encryption.encrypt(self.data, self.bad_public_key)

        with self.assertRaises(DecryptionError) as error:
            # using a private key which is not combinted to the public key used
            # to decrypt data
            self.encryption.decrypt(encrypted, self.private_key)

        self.assertEqual(str(error.exception), "Failed to verify tag")

        # Now encrypting and decrypting with correct keys
        encrypted = self.encryption.encrypt(self.data, self.public_key)
        decrypted = self.encryption.decrypt(encrypted, self.private_key)

        self.assertEqual(decrypted, self.data)
