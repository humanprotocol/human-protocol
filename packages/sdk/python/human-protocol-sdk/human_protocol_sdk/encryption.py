from typing import Optional, List
from pgpy import PGPKey, PGPMessage
from pgpy.constants import SymmetricKeyAlgorithm
from pgpy.errors import PGPError


class Encryption:
    """
    A class that provides encryption and decryption functionality using PGP (Pretty Good Privacy).
    """

    def __init__(self, private_key_armored: str, passphrase: Optional[str] = None):
        """
        Initializes an Encryption instance.

        Args:
            private_key_armored (str): Armored representation of the private key
            passphrase (str, optional): Passphrase to unlock the private key. Defaults to None.
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

    def sign_and_encrypt(self, message: str, public_keys: List[str]) -> str:
        """
        Signs and encrypts a message using the private key and recipient's public keys.

        Args:
            message (str): Message to sign and encrypt
            public_keys (list[str]): List of armored public keys of the recipients

        Returns:
            str: Armored and signed/encrypted message
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

    def decrypt(self, message: str, public_key: Optional[str] = None) -> str:
        """
        Decrypts a message using the private key.

        Args:
            message (str): Armored message to decrypt
            public_key (str, optional): Armored public key used for signature verification. Defaults to None.

        Returns:
            str: Decrypted message
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

            return decrypted_message.message.__str__()
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

    def sign(self, message: str) -> str:
        """
        Signs a message using the private key.

        Args:
            message (str): Message to sign

        Returns:
            str: Armored and signed message
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


class EncryptionUtils:
    """
    A utility class that provides additional encryption-related functionalities.
    """

    @staticmethod
    def encrypt(message: str, public_keys: List[str]) -> str:
        """
        Encrypts a message using the recipient's public keys.

        Args:
            message (str): Message to encrypt
            public_keys (list[str]): List of armored public keys of the recipients

        Returns:
            str: Armored and encrypted message
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
        """
        Verifies the signature of a message using the corresponding public key.

        Args:
            message (str): Armored message to verify
            public_key (str): Armored public key

        Returns:
            bool: True if the signature is valid, False otherwise
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
        """
        Extracts the signed data from an armored signed message.

        Args:
            message (str): Armored message

        Returns:
            str: Extracted signed data
        """
        try:
            signed_message = (
                PGPMessage().from_blob(message) if isinstance(message, str) else message
            )
            return signed_message.message.__str__()
        except PGPError as e:
            return False
