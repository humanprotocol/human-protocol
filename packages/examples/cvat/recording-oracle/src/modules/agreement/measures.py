import numpy as np


def _validate_nd(M: np.ndarray, n=2):
    """Validates that M has n dimensions."""
    if M.ndim != n:
        raise ValueError(f"Input must be a n-dimensional array-like.")


def _validate_dtype_is_subtype_of(M: np.ndarray, supertype: np.dtype):
    """Validates the data type of M is a subtype of supertype."""
    if not issubclass(M.dtype.type, supertype):
        raise ValueError(
            f"Input must have a data type that is a subtype of " f"{supertype}"
        )


def _validate_all_positive(M: np.ndarray):
    """
    Validates that all entries in M are positive (including 0).
    Raises a ValueError if not.
    """
    if np.any(M < 0):
        raise ValueError("Inputs must all be positive")


def _validate_sufficient_annotations(M, n=1):
    """Validates that M contains enough annotations."""
    if M.sum() <= n:
        raise ValueError(f"Input must have more than {1} annotation.")


def _validate_incidence_matrix(M):
    """Validates that M is an incidence matrix."""
    _validate_nd(M, n=2)
    _validate_dtype_is_subtype_of(M, np.integer)
    _validate_all_positive(M)
    _validate_sufficient_annotations(M, n=1)


def _validate_confusion_matrix(M):
    """Validates that M is a confusion Matrix."""
    _validate_incidence_matrix(M)

    if M.shape[0] != M.shape[1]:
        raise ValueError("Input must be a square matrix.")


def percent_agreement(data: np.ndarray, data_format="im") -> float:
    """
    Returns the overall agreement percentage observed across the data.

    Args:
        data: Annotation data.
        data_format: The format of data. Options are 'im' for an incidence
            matrix and 'cm' for a confusion matrix. Defaults to 'im'.
    """
    data = np.asarray(data)

    if data_format == "cm":
        _validate_confusion_matrix(data)
        return np.diag(data).sum() / data.sum()

    # implicitly assumes incidence matrix
    _validate_incidence_matrix(data)

    n_raters = np.max(data)
    item_agreements = np.sum(data * data, 1) - n_raters
    max_item_agreements = n_raters * (n_raters - 1)
    return (item_agreements / max_item_agreements).mean()


def cohens_kappa(data: np.ndarray) -> float:
    """
    Returns Cohen's Kappa for the provided annotations.

    Args:
         data: Annotation data, provided as K x K confusion matrix, with K =
            number of labels.
    """
    data = np.asarray(data)

    agreement_observed = percent_agreement(data, "cm")
    agreement_expected = np.matmul(data.sum(0), data.sum(1)) / data.sum() ** 2

    return (agreement_observed - agreement_expected) / (1 - agreement_expected)


def fleiss_kappa(data: np.ndarray) -> float:
    """
    Returns Fleisss' Kappa for the provided annotations.

    Args:
         data: Annotation data, provided as I x K incidence matrix, with
            I = number of items and K = number of labels.
    """
    data = np.asarray(data)

    agreement_observed = percent_agreement(data, "im")

    class_probabilities = data.sum(0) / data.sum()
    agreement_expected = np.power(class_probabilities, 2).sum()

    return (agreement_observed - agreement_expected) / (1 - agreement_expected)
