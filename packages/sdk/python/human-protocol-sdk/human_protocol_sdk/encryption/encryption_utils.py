"""Utility helpers for PGP encryption tasks."""

from typing import List

from pgpy import PGPKey, PGPMessage
from pgpy.constants import SymmetricKeyAlgorithm
from pgpy.errors import PGPError


class EncryptionUtils:
    """Utility helpers for PGP encryption-related functionality."""

    @staticmethod
    def encrypt(message: str, public_keys: List[str]) -> str:
        """Encrypt a message using recipient public keys.

        Args:
            message: Message to encrypt.
            public_keys: Armored public keys of the recipients.

        Returns:
            Armored encrypted message.

        Example:
            ```python
            from human_protocol_sdk.encryption import EncryptionUtils

            encrypted_message = EncryptionUtils.encrypt(
                "MESSAGE",
                ["-----BEGIN PGP PUBLIC KEY BLOCK-----..."],
            )
            ```
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
        """Verify the signature of a message.

        Args:
            message: Armored message to verify.
            public_key: Armored public key.

        Returns:
            True if the signature is valid, False otherwise.
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
        """Extract the signed data from an armored signed message.

        Args:
            message: Armored message.

        Returns:
            Extracted signed data.
        """
        try:
            signed_message = (
                PGPMessage().from_blob(message) if isinstance(message, str) else message
            )
            return signed_message.message.__str__()
        except PGPError as e:
            return False

    @staticmethod
    def is_encrypted(message: str) -> bool:
        """Check whether a provided message is armored and encrypted.

        Args:
            message: Text to check.

        Returns:
            True if the message is a PGP message, False otherwise.
        """
        try:
            unarmored = PGPMessage.ascii_unarmor(message)
            return unarmored.get("magic") == "MESSAGE"
        except (ValueError, PGPError):
            return False
