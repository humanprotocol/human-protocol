import numpy as np

from .validations import (
    validate_incidence_matrix,
    validate_confusion_matrix,
)


def percent_agreement(
    data: np.ndarray, data_format="im", invalid_return=np.nan
) -> float:
    """
    Returns the overall agreement percentage observed across the data.

    Args:
        data: Annotation data.
        data_format: The format of data. Options are 'im' for an incidence
            matrix and 'cm' for a confusion matrix. Defaults to 'im'.
        invalid_return: value to return if result is np.nan. Defaults to np.nan.
    """
    data = np.asarray(data)

    match data_format:
        case "cm":
            validate_confusion_matrix(data)
            percent = np.diag(data).sum() / data.sum()
        case _:
            # implicitly assumes incidence matrix
            validate_incidence_matrix(data)

            n_raters = np.sum(data, 1)
            item_agreements = np.sum(data * data, 1) - n_raters
            max_item_agreements = n_raters * (n_raters - 1)
            percent = item_agreements.sum() / max_item_agreements.sum()

    if np.isnan(percent):
        percent = invalid_return

    return percent


def cohens_kappa(data: np.ndarray, invalid_return=np.nan) -> float:
    """
    Returns Cohen's Kappa for the provided annotations.

    Args:
         data: Annotation data, provided as K x K confusion matrix, with K =
            number of labels.
        invalid_return: value to return if result is np.nan. Defaults to np.nan.
    """
    data = np.asarray(data)

    agreement_observed = percent_agreement(data, "cm")
    agreement_expected = np.matmul(data.sum(0), data.sum(1)) / data.sum() ** 2

    kappa = (agreement_observed - agreement_expected) / (1 - agreement_expected)

    if np.isnan(kappa):
        kappa = invalid_return

    return kappa


def fleiss_kappa(data: np.ndarray, invalid_return=np.nan) -> float:
    """
    Returns Fleisss' Kappa for the provided annotations.

    Args:
         data: Annotation data, provided as I x K incidence matrix, with
            I = number of items and K = number of labels.
        invalid_return: value to return if result is np.nan. Defaults to np.nan.
    """
    data = np.asarray(data)

    agreement_observed = percent_agreement(data, "im")

    class_probabilities = data.sum(0) / data.sum()
    agreement_expected = np.power(class_probabilities, 2).sum()

    # in case all votes have been for the same class return percentage
    if agreement_expected == agreement_observed == 1.0:
        return 1.0

    kappa = (agreement_observed - agreement_expected) / (1 - agreement_expected)

    if np.isnan(kappa):
        kappa = invalid_return

    return kappa
