"""Utility helpers for PGP encryption tasks."""

from typing import List

from pgpy import PGPKey, PGPMessage
from pgpy.constants import SymmetricKeyAlgorithm
from pgpy.errors import PGPError


class EncryptionUtils:
    """Utility class providing static methods for PGP encryption operations.

    This class offers helper methods for encrypting messages, verifying signatures,
    extracting signed data, and checking message encryption status without requiring
    a private key instance.
    """

    @staticmethod
    def encrypt(message: str, public_keys: List[str]) -> str:
        """Encrypt a message using recipient public keys.

        Encrypts a message so that only holders of the corresponding private keys
        can decrypt it. Does not sign the message.

        Args:
            message (str): Plain text message to encrypt.
            public_keys (List[str]): List of armored PGP public keys of the recipients.

        Returns:
            Armored encrypted PGP message.

        Raises:
            PGPError: If encryption fails or public keys are invalid.

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

        Checks if a signed message has a valid signature from the holder of
        the private key corresponding to the provided public key.

        Args:
            message (str): Armored PGP message to verify.
            public_key (str): Armored PGP public key to verify the signature against.

        Returns:
            ``True`` if the signature is valid, ``False`` otherwise.

        Example:
            ```python
            from human_protocol_sdk.encryption import EncryptionUtils

            is_valid = EncryptionUtils.verify(
                signed_message,
                "-----BEGIN PGP PUBLIC KEY BLOCK-----..."
            )
            ```
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

        Retrieves the original message content from a PGP signed message without
        verifying the signature.

        Args:
            message (str): Armored PGP signed message.

        Returns:
            Extracted message content, or ``False`` if extraction fails.

        Example:
            ```python
            from human_protocol_sdk.encryption import EncryptionUtils

            original_message = EncryptionUtils.get_signed_data(signed_message)
            ```
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
        """Check whether a message is armored and encrypted.

        Determines if the provided text is a valid PGP encrypted message by checking
        the message header.

        Args:
            message (str): Text to check for encryption.

        Returns:
            ``True`` if the message is a PGP encrypted message, ``False`` otherwise.

        Example:
            ```python
            from human_protocol_sdk.encryption import EncryptionUtils

            if EncryptionUtils.is_encrypted(some_text):
                print("Message is encrypted")
            ```
        """
        try:
            unarmored = PGPMessage.ascii_unarmor(message)
            return unarmored.get("magic") == "MESSAGE"
        except (ValueError, PGPError):
            return False
