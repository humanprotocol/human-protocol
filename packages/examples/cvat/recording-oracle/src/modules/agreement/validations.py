import numpy as np


def validate_nd(M: np.ndarray, n=2):
    """Validates that M has n dimensions."""
    if M.ndim != n:
        raise ValueError(f"Input must be a {n}-dimensional array-like.")


def validate_dtype_is_subtype_of(M: np.ndarray, supertype: np.dtype):
    """Validates the data type of M is a subtype of supertype."""
    if not issubclass(M.dtype.type, supertype):
        raise ValueError(
            f"Input must have a data type that is a subtype of " f"{supertype}"
        )


def validate_all_positive(M: np.ndarray):
    """
    Validates that all entries in M are positive (including 0).
    Raises a ValueError if not.
    """
    if np.any(M < 0):
        raise ValueError("Inputs must all be positive")


def validate_sufficient_annotations(M: np.ndarray, n=1):
    """Validates that M contains enough annotations."""
    if M.sum() <= n:
        raise ValueError(f"Input must have more than {1} annotation.")


def validate_incidence_matrix(M: np.ndarray):
    """Validates that M is an incidence matrix."""
    validate_nd(M, n=2)
    validate_dtype_is_subtype_of(M, np.numeric)
    validate_all_positive(M)
    validate_sufficient_annotations(M, n=1)


def validate_confusion_matrix(M):
    """Validates that M is a confusion Matrix."""
    validate_incidence_matrix(M)

    if M.shape[0] != M.shape[1]:
        raise ValueError("Input must be a square matrix.")


def validate_equal_shape(a: np.ndarray, b: np.ndarray):
    """Validates that a and b have the same shape."""
    if a.shape != b.shape:
        raise ValueError("All inputs must have the same shape.")
