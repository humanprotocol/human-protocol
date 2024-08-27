"""Validation utils"""


class ValidationResult:
    """
    Helper class that should be used for validation purposes
    It encapsulates validation logic and helping during generating response body
    """

    def __init__(self) -> None:
        self.is_valid = True
        self.errors = []

    def add_error(self, field: str, message: str) -> None:
        self.errors.append({"field": field, "message": message})
        self.is_valid = False

    def to_dict(self) -> dict:
        return {"errors": self.errors}
