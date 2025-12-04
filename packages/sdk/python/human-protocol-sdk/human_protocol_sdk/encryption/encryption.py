"""Encrypt, decrypt, sign, and verify messages using PGP."""

from typing import Optional, List, Union
from pgpy import PGPKey, PGPMessage
from pgpy.constants import SymmetricKeyAlgorithm
from pgpy.errors import PGPError


class Encryption:
    """Encryption and decryption helper using PGP (Pretty Good Privacy)."""

    def __init__(self, private_key_armored: str, passphrase: Optional[str] = None):
        """Create an Encryption helper.

        Args:
            private_key_armored: Armored representation of the private key.
            passphrase: Passphrase to unlock the private key.
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

        Args:
            message: Message to sign and encrypt.
            public_keys: Armored public keys of the recipients.

        Returns:
            Armored, signed, and encrypted message.

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

        Args:
            message: Armored message to decrypt.
            public_key: Optional armored public key to verify signatures.

        Returns:
            Decrypted message bytes.

        Example:
            ```python
            from human_protocol_sdk.encryption import Encryption

            encryption = Encryption("-----BEGIN PGP PRIVATE KEY BLOCK-----...", "passphrase")
            decrypted_message = encryption.decrypt(encrypted_message)
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

        Args:
            message: Message to sign.

        Returns:
            Armored signed message.

        Example:
            ```python
            from human_protocol_sdk.encryption import Encryption

            encryption = Encryption("-----BEGIN PGP PRIVATE KEY BLOCK-----...", "passphrase")
            signed_message = await encryption.sign("MESSAGE")
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
