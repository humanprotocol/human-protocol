"""Module containing Inter Rater Agreement Measures."""
from copy import copy
from functools import partial
from typing import Sequence, Optional, Callable, Union
from warnings import warn

import numpy as np

from .bootstrap import confidence_intervals
from .utils import label_counts, confusion_matrix, observed_and_expected_differences


def agreement(
    annotations: Sequence,
    measure="krippendorffs_alpha",
    labels: Optional[Sequence] = None,
    bootstrap_method: Optional[str] = None,
    bootstrap_kwargs: Optional[dict] = None,
    measure_kwargs: Optional[dict] = None,
) -> dict:
    """
    Calculates agreement across the given data using the given method.

    Args:
        annotations: Annotation data. Must be a N x M Matrix, where N is the number of annotated items and M is the number of annotators. Missing values must be indicated by nan.
        measure: Specifies the method to use. Must be one of 'cohens_kappa', 'percentage', 'fleiss_kappa', 'sigma' or 'krippendorffs_alpha'.
        labels: List of labels to use for the annotation. If set to None, labels are inferred from the data. If provided, values not in the labels are set to nan.
        bootstrap_method: Name of the bootstrap method to use for calculating confidence intervals.
            If set to None, no confidence intervals are calculated.  If provided, must be one of 'percentile' or 'bca'.
        bootstrap_kwargs: Dictionary of keyword arguments to be passed to the bootstrap function.
        measure_kwargs: Dictionary of keyword arguments to be passed to the measure function.

    Returns: A dictionary containing the keys "results" and "config". Results contains the scores, while config contains parameters that produced the results.
    """
    orig_data = copy(annotations)  # copy of original data for config
    annotations = np.asarray(annotations)

    # make sure, the string representation of nan fits in array
    if annotations.dtype.kind == "U" and annotations.itemsize < 3:
        annotations = annotations.astype("<U3")

    # filter out labels not in given set
    if labels is not None:
        labels = np.asarray(labels)
        nan_mask = ~np.any(annotations[..., np.newaxis] == labels, axis=-1)
        annotations[nan_mask] = np.nan

    match measure:
        case "fleiss_kappa":
            fn = fleiss_kappa
        case "cohens_kappa":
            fn = cohens_kappa
        case "percentage":
            fn = percentage
        case "krippendorffs_alpha":
            fn = krippendorffs_alpha
        case "sigma":
            fn = sigma
        case _:
            raise ValueError(f"Provided measure {measure} is not supported.")

    # calculate score
    if measure_kwargs is None:
        measure_kwargs = {}

    fn = partial(fn, **measure_kwargs)
    score = fn(annotations)

    # calculate bootstrap
    if bootstrap_method is None:
        ci = None
        confidence_level = None
    else:
        if bootstrap_kwargs is None:
            bootstrap_kwargs = {}

        ci, _ = confidence_intervals(
            annotations,
            statistic_fn=fn,
            algorithm=bootstrap_method,
            **bootstrap_kwargs,
        )
        confidence_level = bootstrap_kwargs.get(
            "confidence_level",
            confidence_intervals.__defaults__[2],
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
            "annotations": orig_data,
            "bootstrap_method": bootstrap_method,
            "bootstrap_kwargs": bootstrap_kwargs,
            "measure_kwargs": measure_kwargs,
        },
    }


def percentage(annotations: np.ndarray) -> float:
    """
    Returns the overall agreement percentage observed across the data.

    Args:
        annotations: Annotation data. Must be a N x M Matrix, where N is the number of annotated items and M is the number of annotators. Missing values must be indicated by nan.

    Returns:
        Value between 0.0 and 1.0, indicating the percentage of agreement.
    """
    annotations = np.asarray(annotations)
    return _percentage_from_label_counts(label_counts(annotations))


def _percentage_from_label_counts(label_counts):
    n_raters = np.sum(label_counts, 1)
    item_agreements = (np.sum(label_counts * label_counts, 1) - n_raters).sum()
    max_item_agreements = (n_raters * (n_raters - 1)).sum()

    if max_item_agreements == 0:
        warn(
            "All annotations were made by a single annotator, check your data to ensure this is not an error. Returning 1.0"
        )
        return 1.0

    return item_agreements / max_item_agreements


def _kappa(agreement_observed, agreement_expected):
    if agreement_expected == 1.0:
        warn(
            "Annotations contained only a single value, check your data to ensure this is not an error. Returning 1.0."
        )
        return 1.0

    return (agreement_observed - agreement_expected) / (1 - agreement_expected)


def cohens_kappa(annotations: np.ndarray) -> float:
    """
    Returns Cohen's Kappa for the provided annotations.

    Args:
        annotations: Annotation data. Must be a N x M Matrix, where N is the number of annotated items and M is the number of annotators. Missing values must be indicated by nan.

    Returns:
        Value between -1.0 and 1.0, indicating the degree of agreement between both raters.
    """
    annotations = np.asarray(annotations)
    cm = confusion_matrix(annotations)

    agreement_observed = np.diag(cm).sum() / cm.sum()
    agreement_expected = np.matmul(cm.sum(0), cm.sum(1)) / cm.sum() ** 2

    return _kappa(agreement_observed, agreement_expected)


def fleiss_kappa(annotations: np.ndarray) -> float:
    """
    Returns Fleisss' Kappa for the provided annotations.

    Args:
         annotations: annotations: Annotation data. Must be a N x M Matrix, where N is the number of items and M is the number of annotators.

    Returns:
        Value between -1.0 and 1.0, indicating the degree of agreement between all raters.
    """
    annotations = np.asarray(annotations)
    im = label_counts(annotations)

    agreement_observed = _percentage_from_label_counts(im)
    class_probabilities = im.sum(0) / im.sum()
    agreement_expected = np.power(class_probabilities, 2).sum()

    return _kappa(agreement_observed, agreement_expected)


def krippendorffs_alpha(
    annotations: np.ndarray, distance_function: Union[Callable, str]
) -> float:
    """
    Calculates Krippendorff's Alpha for the given annotations (item-value pairs),
    using the given distance function.

    Args:
        annotations: Annotation data. Must be a N x M Matrix, where N is the number of annotated items and M is the number of annotators. Missing values must be indicated by nan.
        distance_function: Function to calculate distance between two values.
            Calling `distance_fn(annotations[i, j], annotations[p, q])` must return a number.
            Can also be one of 'nominal', 'ordinal', 'interval' or 'ratio' for
            default functions pertaining to the level of measurement of the data.

    Returns: Value between -1.0 and 1.0, indicating the degree of agreement.

    """
    difference_observed, difference_expected = observed_and_expected_differences(
        annotations, distance_function
    )
    return 1 - difference_observed.mean() / difference_expected.mean()


def sigma(
    annotations: np.ndarray, distance_function: Union[Callable, str], p=0.05
) -> float:
    """
    Calculates the Sigma Agreement Measure for the given annotations (item-value pairs),
    using the given distance function.
    For details, see https://dl.acm.org/doi/fullHtml/10.1145/3485447.3512242.

    Args:
        annotations: Annotation data. Must be a N x M Matrix, where N is the number of annotated items and M is the number of annotators. Missing values must be indicated by nan.
        distance_function: Function to calculate distance between two values.
            Calling `distance_fn(annotations[i, j], annotations[p, q])` must return a number.
            Can also be one of 'nominal', 'ordinal', 'interval' or 'ratio' for
            default functions pertaining to the level of measurement of the data.
        p: Probability threshold between 0.0 and 1.0 determining statistical significant difference. The lower, the stricter.

    Returns: Value between 0.0 and 1.0, indicating the degree of agreement.
    """
    if p < 0.0 or p > 1.0:
        raise ValueError(f"Parameter 'p' must be between 0.0 and 1.0")

    difference_observed, difference_expected = observed_and_expected_differences(
        annotations, distance_function
    )
    difference_crit = np.quantile(difference_expected, p)
    return np.mean(difference_observed < difference_crit)
