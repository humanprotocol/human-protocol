import numpy as np

from src.modules.agreement.validations import (
    validate_incidence_matrix,
    validate_confusion_matrix,
)


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
        validate_confusion_matrix(data)
        return np.diag(data).sum() / data.sum()

    # implicitly assumes incidence matrix
    validate_incidence_matrix(data)

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
