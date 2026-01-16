"""Encrypt, decrypt, sign, and verify messages using PGP."""

from typing import Optional, List, Union
from pgpy import PGPKey, PGPMessage
from pgpy.constants import SymmetricKeyAlgorithm
from pgpy.errors import PGPError


class Encryption:
    """Encryption and decryption helper using PGP (Pretty Good Privacy).

    This class provides methods to sign, encrypt, decrypt, and verify messages
    using PGP encryption with private/public key pairs.

    Attributes:
        private_key (PGPKey): The unlocked PGP private key.
        passphrase (Optional[str]): Passphrase used to unlock the private key.
    """

    def __init__(self, private_key_armored: str, passphrase: Optional[str] = None):
        """Initialize an Encryption instance with a private key.

        Args:
            private_key_armored (str): Armored representation of the PGP private key.
            passphrase (Optional[str]): Passphrase to unlock the private key if it's locked.

        Raises:
            ValueError: If the private key is invalid, cannot be unlocked with the passphrase,
                or is locked and no passphrase is provided.

        Example:
            ```python
            from human_protocol_sdk.encryption import Encryption

            encryption = Encryption(
                "-----BEGIN PGP PRIVATE KEY BLOCK-----...",
                "your-passphrase"
            )
            ```
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

    def sign_and_encrypt(
        self, message: Union[str, bytes], public_keys: List[str]
    ) -> str:
        """Sign and encrypt a message with recipient public keys.

        Signs the message with the private key and encrypts it for all specified recipients.

        Args:
            message (Union[str, bytes]): Message content to sign and encrypt.
            public_keys (List[str]): List of armored PGP public keys of the recipients.

        Returns:
            Armored, signed, and encrypted PGP message.

        Raises:
            ValueError: If the private key cannot be unlocked or encryption fails.

        Example:
            ```python
            from human_protocol_sdk.encryption import Encryption

            encryption = Encryption("-----BEGIN PGP PRIVATE KEY BLOCK-----...", "passphrase")
            encrypted_message = encryption.sign_and_encrypt(
                "your message",
                ["-----BEGIN PGP PUBLIC KEY BLOCK-----..."],
            )
            ```
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

    def decrypt(self, message: str, public_key: Optional[str] = None) -> bytes:
        """Decrypt a message using the private key.

        Decrypts an encrypted message and optionally verifies the signature using
        the sender's public key.

        Args:
            message (str): Armored PGP message to decrypt.
            public_key (Optional[str]): Optional armored public key to verify the message signature.

        Returns:
            Decrypted message as bytes.

        Raises:
            ValueError: If the private key cannot be unlocked, decryption fails,
                or signature verification fails when a public key is provided.

        Example:
            ```python
            from human_protocol_sdk.encryption import Encryption

            encryption = Encryption("-----BEGIN PGP PRIVATE KEY BLOCK-----...", "passphrase")
            decrypted_message = encryption.decrypt(encrypted_message)

            # Or with signature verification:
            decrypted_message = encryption.decrypt(
                encrypted_message,
                public_key="-----BEGIN PGP PUBLIC KEY BLOCK-----..."
            )
            ```
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

            if isinstance(decrypted_message.message, str):
                return bytes(decrypted_message.message, encoding="utf-8")
            else:
                return bytes(decrypted_message.message)
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

    def sign(self, message: Union[str, bytes]) -> str:
        """Sign a message with the private key.

        Creates a cleartext signed message that can be verified by anyone with
        the corresponding public key.

        Args:
            message (Union[str, bytes]): Message content to sign.

        Returns:
            Armored signed PGP message in cleartext format.

        Raises:
            ValueError: If the private key cannot be unlocked or signing fails.

        Example:
            ```python
            from human_protocol_sdk.encryption import Encryption

            encryption = Encryption("-----BEGIN PGP PRIVATE KEY BLOCK-----...", "passphrase")
            signed_message = encryption.sign("MESSAGE")
            ```
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
