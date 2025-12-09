"""Decorators for SDK functionality."""

from typing import Callable, Any


class RequiresSignerError(Exception):
    """Raised when a transaction-signing method is called without proper Web3 account configuration.

    This exception is raised by the `@requires_signer` decorator when a method requiring
    transaction signing capabilities is invoked on a Web3 instance that lacks:

    - A default account (w3.eth.default_account)
    - SignAndSendRawMiddlewareBuilder middleware for transaction signing
    """

    pass


def requires_signer(method: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator that ensures Web3 instance has signing capabilities before executing a method.

    This decorator validates that the Web3 instance has both a default account configured
    and the SignAndSendRawMiddlewareBuilder middleware installed. These are required for
    methods that need to sign and send transactions.

    Args:
        method (Callable[..., Any]): The method to decorate (must be a method of a class with a `w3` attribute).

    Returns:
        Wrapped method that performs validation before execution.

    Raises:
        RequiresSignerError: If the Web3 instance lacks a default account or signing middleware.

    Example:
        ```python
        from web3 import Web3
        from web3.middleware import SignAndSendRawMiddlewareBuilder
        from human_protocol_sdk.decorators import requires_signer

        class MyClient:
            def __init__(self, w3):
                self.w3 = w3

            @requires_signer
            def send_transaction(self):
                # This method requires a signer
                pass
        ```
    """

    def wrapper(self: Any, *args: Any, **kwargs: Any) -> Any:
        if not self.w3.eth.default_account:
            raise RequiresSignerError("You must add an account to Web3 instance")
        if not self.w3.middleware_onion.get("SignAndSendRawMiddlewareBuilder"):
            raise RequiresSignerError(
                "You must add SignAndSendRawMiddlewareBuilder middleware to Web3 instance"
            )
        return method(self, *args, **kwargs)

    return wrapper
