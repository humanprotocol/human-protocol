import unittest
from test.human_protocol_sdk.utils.encryption import (
    public_key,
    public_key2,
    public_key3,
    signed_message,
    message,
)

from human_protocol_sdk.encryption import EncryptionUtils


class TestEncryptionUtils(unittest.TestCase):
    def test_encrypt_unsigned_message(self):
        encrypted_message = EncryptionUtils.encrypt(message, [public_key2, public_key3])
        self.assertIsInstance(encrypted_message, str)

    def test_verify(self):
        result = EncryptionUtils.verify(signed_message, public_key)
        self.assertTrue(result)

    def test_verify_invalid_signature(self):
        with self.assertRaises(ValueError) as cm:
            EncryptionUtils.verify(message, public_key)
        self.assertEqual(f"Expected: ASCII-armored PGP data", str(cm.exception))

    def test_verify_invalid_public_key(self):
        invalid_public_key = """invalid_public_key"""
        with self.assertRaises(ValueError) as cm:
            EncryptionUtils.verify(signed_message, invalid_public_key)
        self.assertEqual(f"Expected: ASCII-armored PGP data", str(cm.exception))

    def test_get_signed_data(self):
        result = EncryptionUtils.get_signed_data(signed_message)
        self.assertEqual(result, message)

    def test_get_signed_data_invalid_message(self):
        with self.assertRaises(ValueError) as cm:
            EncryptionUtils.get_signed_data("Invalid message")
        self.assertEqual(f"Expected: ASCII-armored PGP data", str(cm.exception))
