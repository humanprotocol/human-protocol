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

    :param annotations: Annotation data.
        Must be a N x M Matrix, where N is the number of annotated items and
        M is the number of annotators. Missing values must be indicated by nan.
    :param measure: Specifies the method to use.
        Must be one of 'cohens_kappa', 'percentage', 'fleiss_kappa',
        'sigma' or 'krippendorffs_alpha'.
    :param labels: List of labels to use for the annotation.
        If set to None, labels are inferred from the data.
        If provided, values not in the labels are set to nan.
    :param bootstrap_method: Name of the bootstrap method to use
        for calculating confidence intervals.
        If set to None, no confidence intervals are calculated.
        If provided, must be one of 'percentile' or 'bca'.
    :param bootstrap_kwargs: Dictionary of keyword arguments to be passed
        to the bootstrap function.
    :param measure_kwargs: Dictionary of keyword arguments to be
        passed to the measure function.

    :return: A dictionary containing the keys "results" and "config".
        Results contains the scores, while config contains parameters
        that produced the results.

    :example:
        .. code-block:: python

            from human_protocol_sdk.agreement import agreement

            annotations = [
                ['cat', 'not', 'cat'],
                ['cat', 'cat', 'cat'],
                ['not', 'not', 'not'],
                ['cat', 'nan', 'not'],
            ]

            agreement_report = agreement(annotations, measure="fleiss_kappa")
            print(agreement_report)
            # {
            #     'results': {
            #         'measure': 'fleiss_kappa',
            #         'score': 0.3950000000000001,
            #         'ci': None,
            #         'confidence_level': None
            #     },
            #     'config': {
            #         'measure': 'fleiss_kappa',
            #         'labels': array(['cat', 'not'], dtype='<U3'),
            #         'data': array([['cat', 'not', 'cat'],
            #                        ['cat', 'cat', 'cat'],
            #                        ['not', 'not', 'not'],
            #                        ['cat', '', 'not']], dtype='<U3'),
            #         'bootstrap_method': None,
            #         'bootstrap_kwargs': {},
            #         'measure_kwargs': {}
            #     }
            # }

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

    :param annotations: Annotation data.
        Must be a N x M Matrix, where N is the number of annotated items and
        M is the number of annotators. Missing values must be indicated by nan.

    :return: Value between 0.0 and 1.0, indicating the percentage of agreement.

    :example:
        .. code-block:: python

            from human_protocol_sdk.agreement.measures import percentage
            import numpy as np

            annotations = np.asarray([
                ["cat", "not", "cat"],
                ["cat", "cat", "cat"],
                ["not", "not", "not"],
                ["cat", "cat", "not"],
            ])
            print(percentage(annotations))
            # 0.7
    """
    annotations = np.asarray(annotations)
    return _percentage_from_label_counts(label_counts(annotations))


def _percentage_from_label_counts(label_counts):
    n_raters = np.sum(label_counts, 1)
    item_agreements = (np.sum(label_counts * label_counts, 1) - n_raters).sum()
    max_item_agreements = (n_raters * (n_raters - 1)).sum()

    if max_item_agreements == 0:
        warn(
            """
            All annotations were made by a single annotator,
            check your data to ensure this is not an error.
            Returning 1.0
            """
        )
        return 1.0

    return item_agreements / max_item_agreements


def _kappa(agreement_observed, agreement_expected):
    if agreement_expected == 1.0:
        warn(
            """
            Annotations contained only a single value,
            check your data to ensure this is not an error.
            Returning 1.0.
            """
        )
        return 1.0

    return (agreement_observed - agreement_expected) / (1 - agreement_expected)


def cohens_kappa(annotations: np.ndarray) -> float:
    """
    Returns Cohen's Kappa for the provided annotations.

    :param annotations: Annotation data.
        Must be a N x M Matrix, where N is the number of annotated items and M
        is the number of annotators. Missing values must be indicated by nan.

    :return: Value between -1.0 and 1.0,
        indicating the degree of agreement between both raters.

    :example:
        .. code-block:: python

            from human_protocol_sdk.agreement.measures import cohens_kappa
            import numpy as np

            annotations = np.asarray([
                    ["cat", "cat"],
                    ["cat", "cat"],
                    ["not", "cat"],
                    ["not", "cat"],
                    ["cat", "not"],
                    ["not", "not"],
                    ["not", "not"],
                    ["not", "not"],
                    ["not", "not"],
                    ["not", "not"],
            ])
            print(cohens_kappa(annotations))
            # 0.348
    """
    annotations = np.asarray(annotations)
    cm = confusion_matrix(annotations)

    agreement_observed = np.diag(cm).sum() / cm.sum()
    agreement_expected = np.matmul(cm.sum(0), cm.sum(1)) / cm.sum() ** 2

    return _kappa(agreement_observed, agreement_expected)


def fleiss_kappa(annotations: np.ndarray) -> float:
    """
    Returns Fleisss' Kappa for the provided annotations.

    :param annotations: Annotation data.
        Must be a N x M Matrix, where N is the number of items and
        M is the number of annotators.

    :return: Value between -1.0 and 1.0,
        indicating the degree of agreement between all raters.

    :example:
        .. code-block:: python

            from human_protocol_sdk.agreement.measures import fleiss_kappa
            import numpy as np

            # 3 raters, 2 classes
            annotations = np.asarray([
                ["cat", "not", "cat"],
                ["cat", "cat", "cat"],
                ["not", "not", "not"],
                ["cat", "cat", "not"],
            ])
            print(f"{fleiss_kappa(annotations):.3f}")
            # 0.395
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

    :param annotations: Annotation data.
        Must be a N x M Matrix, where N is the number of annotated items and
        M is the number of annotators. Missing values must be indicated by nan.
    :param distance_function: Function to calculate distance between two values.
        Calling `distance_fn(annotations[i, j], annotations[p, q])` must return a number.
        Can also be one of 'nominal', 'ordinal', 'interval' or 'ratio' for
        default functions pertaining to the level of measurement of the data.

    :return: Value between -1.0 and 1.0,
        indicating the degree of agreement.

    :example:
        .. code-block:: python

            from human_protocol_sdk.agreement.measures import krippendorffs_alpha
            import numpy as np

            annotations = np.asarray([
                [0, 0, 0],
                [0, 1, 1]]
            )
            print(krippendorffs_alpha(annotations, distance_function="nominal"))
            # 0.375

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

    :param annotations: Annotation data.
        Must be a N x M Matrix, where N is the number of annotated items and
        M is the number of annotators. Missing values must be indicated by nan.
    :param distance_function: Function to calculate distance between two values.
        Calling `distance_fn(annotations[i, j], annotations[p, q])` must return a number.
        Can also be one of 'nominal', 'ordinal', 'interval' or 'ratio' for
        default functions pertaining to the level of measurement of the data.
    :param p: Probability threshold between 0.0 and 1.0
        determining statistical significant difference. The lower, the stricter.

    :return: Value between 0.0 and 1.0, indicating the degree of agreement.

    :example:
        .. code-block:: python

            from human_protocol_sdk.agreement.measures import sigma
            import numpy as np

            np.random.seed(42)
            n_items = 500
            n_annotators = 5

            # create annotations
            annotations = np.random.rand(n_items, n_annotators)
            means = np.random.rand(n_items, 1) * 100
            scales = np.random.randn(n_items, 1) * 10
            annotations = annotations * scales + means
            d = "interval"

            print(sigma(annotations, d))
            # 0.6538
    """
    if p < 0.0 or p > 1.0:
        raise ValueError(f"Parameter 'p' must be between 0.0 and 1.0")

    difference_observed, difference_expected = observed_and_expected_differences(
        annotations, distance_function
    )
    difference_crit = np.quantile(difference_expected, p)
    return np.mean(difference_observed < difference_crit)
