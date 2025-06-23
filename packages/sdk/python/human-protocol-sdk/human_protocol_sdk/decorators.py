class RequiresSignerError(Exception):
    """Raised when a signer or required middleware is missing in the Web3 instance."""

    pass


def requires_signer(method):
    def wrapper(self, *args, **kwargs):
        if not self.w3.eth.default_account:
            raise RequiresSignerError("You must add an account to Web3 instance")
        if not self.w3.middleware_onion.get("SignAndSendRawMiddlewareBuilder"):
            raise RequiresSignerError(
                "You must add SignAndSendRawMiddlewareBuilder middleware to Web3 instance"
            )
        return method(self, *args, **kwargs)

    return wrapper
