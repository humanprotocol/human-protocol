import unittest
from test.human_protocol_sdk.utils.encryption import (
    private_key,
    private_key2,
    private_key3,
    public_key,
    public_key2,
    public_key3,
    encrypted_message,
    passphrase,
    encrypted_unsigned_message,
    message,
)

from human_protocol_sdk.encryption import Encryption
from pgpy.errors import PGPDecryptionError


class TestEncryption(unittest.TestCase):
    def test_valid_private_key(self):
        encryption = Encryption(private_key)
        self.assertIsInstance(encryption, Encryption)

        encryption = Encryption(private_key3, passphrase)
        self.assertIsInstance(encryption, Encryption)

    def test_locked_private_key(self):
        with self.assertRaises(ValueError) as cm:
            Encryption(private_key3)
        self.assertEqual(f"Private key locked. Passphrase needed", str(cm.exception))

    def test_locked_private_key_with_wrong_passphrase(self):
        with self.assertRaises(PGPDecryptionError) as cm:
            Encryption(private_key3, "Test")
        self.assertEqual(f"Passphrase was incorrect!", str(cm.exception))

    def test_invalid_private_key(self):
        invalid_private_key = "invalid_private_key"

        with self.assertRaises(ValueError) as cm:
            Encryption(invalid_private_key)
        self.assertEqual(f"Expected: ASCII-armored PGP data", str(cm.exception))

    def test_encrypt(self):
        encryption = Encryption(private_key)
        encrypted_message = encryption.sign_and_encrypt(
            message, [public_key2, public_key3]
        )
        self.assertIsInstance(encrypted_message, str)

    def test_encrypt_with_locked_private_key(self):
        encryption = Encryption(private_key3, passphrase)
        encrypted_message = encryption.sign_and_encrypt(
            message, [public_key, public_key2]
        )
        self.assertIsInstance(encrypted_message, str)

    def test_decrypt(self):
        encryption = Encryption(private_key2)
        decrypted_message = encryption.decrypt(encrypted_message)
        self.assertIsInstance(decrypted_message, str)
        self.assertEqual(decrypted_message, message)

    def test_decrypt_checking_signature(self):
        encryption = Encryption(private_key2)
        decrypted_message = encryption.decrypt(encrypted_message, public_key)
        self.assertIsInstance(decrypted_message, str)
        self.assertEqual(decrypted_message, message)

    def test_decrypt_with_locked_private_key(self):
        encryption = Encryption(private_key3, passphrase)
        decrypted_message = encryption.decrypt(encrypted_message)
        self.assertIsInstance(decrypted_message, str)
        self.assertEqual(decrypted_message, message)

    def test_decrypt_wrong_public_key(self):
        encryption = Encryption(private_key2)
        with self.assertRaises(ValueError) as cm:
            encryption.decrypt(encrypted_message, public_key2)
        self.assertEqual(
            f"Failed to decrypt message: Could not find signature with this public key",
            str(cm.exception),
        )

    def test_decrypt_unsigned_message(self):
        encryption = Encryption(private_key3, passphrase)
        decrypted_message = encryption.decrypt(encrypted_unsigned_message)
        self.assertIsInstance(decrypted_message, str)
        self.assertEqual(decrypted_message, message)

    def test_sign(self):
        encryption = Encryption(private_key)
        signed_message = encryption.sign(message)
        self.assertIsInstance(signed_message, str)

    def test_sign_with_locked_private_key(self):
        encryption = Encryption(private_key3, passphrase)
        signed_message = encryption.sign(message)
        self.assertIsInstance(signed_message, str)
