import codecs
import os

from eth_keys import keys as eth_keys

from .encryption import Encryption
from .exceptions import *

encryption = Encryption()

SHARED_MAC_DATA: bytes = os.getenv(
    "SHARED_MAC", "9da0d3721774843193737244a0f3355191f66ff7321e83eae83f7f746eb34350"
).encode("ascii")


def decrypt(private_key: bytes, msg: bytes) -> str:
    """
    Use ECIES to decrypt a message with a given private key and an optional
    MAC.

    Args:
        private_key (bytes): The private_key to decrypt the message with.
        msg (bytes): The message to be decrypted.

    Returns:
        str: returns the plaintext equivalent to the originally encrypted one.
    """
    priv_key = eth_keys.PrivateKey(codecs.decode(private_key, "hex"))
    e = encryption.decrypt(msg, priv_key, shared_mac_data=SHARED_MAC_DATA)
    return e.decode("utf-8")


def encrypt(public_key: bytes, msg: str) -> bytes:
    """
    Use ECIES to encrypt a message with a given public key and optional MAC.

    Args:
        public_key (bytes): The public_key to encrypt the message with.
        msg (str): The message to be encrypted.

    Returns:
        bytes: returns the cryptotext encrypted with the public key.

    """
    pub_key = eth_keys.PublicKey(codecs.decode(public_key, "hex"))
    msg_bytes = msg.encode("utf-8")
    return encryption.encrypt(msg_bytes, pub_key, shared_mac_data=SHARED_MAC_DATA)


def is_encrypted(msg: bytes) -> bool:
    """Returns whether message is already encrypted."""
    return encryption.is_encrypted(msg)
