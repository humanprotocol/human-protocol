"""Module containing Inter Rater Agreement Measures."""

import numpy as np

from warnings import warn

from .validations import (
    validate_incidence_matrix,
    validate_confusion_matrix,
)

from .bootstrap import confidence_intervals

from .utils import (
    label_counts,
    confusion_matrix,
    observed_and_expected_differences,
)

from functools import partial
from typing import Sequence, Optional, Callable, Union


def agreement(
    data: Sequence,
    measure="fleiss_kappa",
    data_format="annotations",
    labels: Optional[Sequence] = None,
    nan_values: Optional[Sequence] = None,
    bootstrap_method: Optional[str] = None,
    bootstrap_kwargs: Optional[dict] = None,
    measure_kwargs: Optional[dict] = None,
) -> dict:
    """
    Calculates agreement across the given data using the given method.

    Args:
        data: Annotated data.
        measure: Specifies the method to use. Must be one of 'percent_agreement', 'fleiss_kappa' or 'cohens_kappa'.
        data_format: The format that the annotations are in. Must be one of 'annotations' or 'label_counts'.
        labels: A list of labels to use for the annotation. If set to None, labels are inferred from the data.
        nan_values: Values to be counted as invalid and filter out from the data.
        bootstrap_method: Name of the bootstrap method to use. If omitted, no bootstrapping is performed. If provided,
            must be one of 'percentile' or 'bca'.
        bootstrap_kwargs: Dictionary of keyword arguments to be passed to the bootstrap function.
        measure_kwargs: Dictionary of keyword arguments to be passed to the measure function.

    Returns: A dictionary containing the keys "results" and "config". Results contains the scores, while config contains parameters that produced the results.
    """
    orig_data = np.array(data)  # copy of original data for config
    data = np.asarray(data)

    # convert data
    match data_format:
        case "annotations":
            if measure == "cohens_kappa":
                # input validation
                if data.shape[1] < 2:  # only a single annotator present
                    raise ValueError(
                        "Annotations contain only a single annotator. "
                        "Must exactly contain two"
                    )
                elif data.shape[1] > 2:
                    warn(
                        "Annotations contain more than two annotators. Only first"
                        ' two will be regarded. Consider using method "fleiss_kappa".'
                    )

                data, labels = confusion_matrix(
                    data.T[0],
                    data.T[1],
                    labels=labels,
                    nan_values=nan_values,
                    return_labels=True,
                )
            else:
                data, labels = label_counts(
                    data, labels=labels, nan_values=nan_values, return_labels=True
                )
        case "label_counts":
            validate_incidence_matrix(data)

            if measure == "cohens_kappa":
                raise ValueError(
                    f"Combination of measure='label_counts' and "
                    f"measure='cohens_kappa' is not supported."
                )
        case _:
            raise ValueError(
                f"data format '{data_format}' is not supported."
                f"Must be either 'annotations' or 'label_counts'."
            )

    match measure:
        case "fleiss_kappa":
            fn = fleiss_kappa
        case "cohens_kappa":
            fn = cohens_kappa
        case "percentage":
            fn = percentage
        case _:
            raise ValueError(f"Provided measure {measure} is not supported.")

    # calculate score
    if measure_kwargs is None:
        measure_kwargs = {}

    fn = partial(fn, **measure_kwargs)
    score = fn(data)

    # calculate bootstrap
    if bootstrap_method is None:
        ci = None
        confidence_level = None
    else:
        if measure == "cohens_kappa":
            warn("Bootstrapping is currently not supported for Cohen's Kappa.")
            ci = (-100.0, -100.0)
            confidence_level = -100.0
        else:
            if bootstrap_kwargs is None:
                bootstrap_kwargs = {}

            ci, _ = confidence_intervals(
                data, statistic_fn=fn, algorithm=bootstrap_method, **bootstrap_kwargs
            )
            confidence_level = bootstrap_kwargs.get(
                "confidence_level", confidence_intervals.__defaults__[2]
            )

    return {
        "results": {
            "measure": measure,
            "score": score,
            "ci": ci,
            "confidence_level": confidence_level,
        },
        "config": {
            "measure": measure,
            "labels": labels,
            "nan_values": nan_values,
            "data": orig_data,
            "data_format": data_format,
            "bootstrap_method": bootstrap_method,
            "bootstrap_kwargs": bootstrap_kwargs,
            "measure_kwargs": measure_kwargs,
        },
    }


def percentage(data: np.ndarray, data_format="im", invalid_return=np.nan) -> float:
    """
    Returns the overall agreement percentage observed across the data.

    Args:
        data: Annotation data.
        data_format: The format that the data is in. Must be one of 'im'
            (incidence matrix) or 'cm' (confusion matrix). Defaults to 'im'.
        invalid_return: Value between 0.0 and 1.0, indicating the percentage of agreement.

    Returns:
        Value between 0.0 and 1.0, indicating the percentage of agreement.
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


def cohens_kappa(data: Sequence, invalid_return=np.nan) -> float:
    """
    Returns Cohen's Kappa for the provided annotations.

    Args:
        data: Annotation data, provided as K x K confusion matrix, with K = number of labels.
        invalid_return: value to return if result is np.nan. Defaults to np.nan.

    Returns:
        Value between -1.0 and 1.0, indicating the degree of agreement between both raters.
    """
    data = np.asarray(data)

    agreement_observed = percentage(data, "cm")
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

    Returns:
        Value between -1.0 and 1.0, indicating the degree of agreement between all raters.
    """
    data = np.asarray(data)

    agreement_observed = percentage(data, "im")

    class_probabilities = data.sum(0) / data.sum()
    agreement_expected = np.power(class_probabilities, 2).sum()

    # in case all votes have been for the same class return percentage
    if agreement_expected == agreement_observed == 1.0:
        return 1.0

    kappa = (agreement_observed - agreement_expected) / (1 - agreement_expected)

    if np.isnan(kappa):
        kappa = invalid_return

    return kappa


def krippendorffs_alpha(
    items: Sequence, values: Sequence, distance_function: Union[Callable, str]
) -> float:
    """
    Calculates Krippendorff's Alpha for the given annotations (item-value pairs),
    using the given distance function.

    Args:
        items: Item Ids, identifying items of an annotation.
        values: Annotation value for a given item id. values[i] was assigned to items[i]. Assumes a single annotation per annotator.
        distance_function: Function to calculate distance between two values.
            Calling `distance_fn(values[i], values[j])` must return a number.
            Can also be one of 'nominal', 'ordinal', 'interval' or 'ratio' for
            default functions pertaining to the level of measurement of the data.

    Returns: Value between -1.0 and 1.0, indicating the degree of agreement.

    """
    difference_observed, difference_expected = observed_and_expected_differences(
        items, values, distance_function
    )
    return 1 - difference_observed.mean() / difference_expected.mean()


def sigma(
    items: Sequence, values: Sequence, distance_function: Union[Callable, str], p=0.05
) -> float:
    """
    Calculates the Sigma Agreement Measure for the given annotations (item-value pairs),
    using the given distance function.
    For details, see https://dl.acm.org/doi/fullHtml/10.1145/3485447.3512242.

    Args:
        items: Item Ids, identifying items of an annotation.
        values: Annotation value for a given item id. values[i] was assigned to items[i]. Assumes a single annotation per annotator.
        distance_function: Function to calculate distance between two values.
            Calling `distance_fn(values[i], values[j])` must return a number.
            Can also be one of 'nominal', 'ordinal', 'interval' or 'ratio' for
            default functions pertaining to the level of measurement of the data.
        p: Probability threshold between 0.0 and 1.0 determining statistical significant difference. The lower, the stricter.

    Returns: Value between 0.0 and 1.0, indicating the degree of agreement.
    """
    difference_observed, difference_expected = observed_and_expected_differences(
        items, values, distance_function
    )
    difference_crit = np.quantile(difference_expected, p)
    return np.mean(difference_observed < difference_crit)
