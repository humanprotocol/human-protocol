class InvalidPublicKey(Exception):
    """
    A custom exception raised when trying to convert bytes
    into an elliptic curve public key.
    """

    pass


class DecryptionError(Exception):
    """
    Raised when a message could not be decrypted.
    """

    pass
