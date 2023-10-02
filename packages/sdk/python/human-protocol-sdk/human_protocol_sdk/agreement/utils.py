"""Module containing helper functions for calculating agreement measures."""

import numpy as np
from collections import Counter
from typing import Sequence, Optional, Tuple, Callable

from pyerf import erf, erfinv

from .validations import (
    validate_nd,
    validate_equal_shape,
    validate_same_dtype,
)


def _filter_labels(labels: Sequence, exclude=None):
    """
    Filters the given sequence of labels, based on the given exclusion values.

    Args:
        labels: The labels to filter.
        exclude: The list of labels to exclude.

    Returns: A list of labels without the given list of labels to exclude.

    """
    if exclude is None:
        return np.asarray(labels)

    # map to preserve label order if user defined labels are passed
    label_to_id = {label: i for i, label in enumerate(labels)}
    exclude = set(exclude)

    labels = sorted(
        set(labels).difference(exclude), key=lambda x: label_to_id.get(x, -1)
    )

    return np.asarray(labels)


def _is_nan(data: np.ndarray, nan_values: Optional[Sequence] = None):
    """Returns a logical index of to filter nan in the given np.ndarray.

    Args:
        data: The values to filter.
        nan_values: If provided, defines which values to count as invalid. If omitted, returns identity index.
    """
    if nan_values is None:
        return np.ones_like(data, dtype=bool)
    else:
        return ~np.isin(
            data, np.unique(nan_values).astype(data.dtype.kind), assume_unique=True
        )


def label_counts(
    annotations: Sequence,
    labels=None,
    nan_values: Optional[Sequence] = None,
    return_labels=False,
):
    """Converts the given sequence of item annotations to an array of label counts per item.

    Args:
        annotations: A two-dimensional sequence. Rows represent items, columns represent annotators.
        labels: List of labels to be counted. Entries not found in the list are omitted. If
            omitted, all labels in the annotations are counted.
        nan_values: Values in the records to be counted as invalid.
        return_labels: Whether to return labels with the counts. Automatically set to true if labels are
            inferred.

    Returns:
        A two-dimensional array of integers. Rows represent items, columns represent labels. If
    """
    annotations = np.asarray(annotations)

    if labels is None:
        labels = np.unique(annotations)

    labels = _filter_labels(labels, nan_values)

    def lcs(annotations, labels):
        c = Counter(annotations)
        return [c.get(label, 0) for label in labels]

    counts = np.asarray([lcs(row, labels) for row in annotations])

    if return_labels:
        return counts, labels

    return counts


def confusion_matrix(
    a: Sequence,
    b: Sequence,
    labels: Optional[Sequence] = None,
    nan_values: Optional[Sequence] = None,
    return_labels=False,
):
    """Generate an N X N confusion matrix from the given sequence of values a and b, where N is the number of unique labels.

    Args:
        a: A sequence of labels.
        b: Another sequence of labels.
        labels: Sequence of labels to be counted. Entries not found in the list are omitted. No labels are provided, the list of labels is inferred from the given annotations.
        nan_values: Value to return if input data is invalid. Invalid values will not be counted.
        return_labels: Whether to return labels with the counts.

    Returns:
        A confusion matrix. Rows represent labels assigned by b, columns represent labels assigned by a.
    """
    a = np.asarray(a)
    b = np.asarray(b)

    validate_same_dtype(a, b)
    validate_nd(a, 1)
    validate_nd(b, 1)
    validate_equal_shape(a, b)

    # create list of unique labels
    if labels is None:
        labels = np.unique(np.concatenate([a, b]))

    labels = _filter_labels(labels, exclude=nan_values)
    n_labels = len(labels)

    # map labels to ids
    label_to_id = {label: i for i, label in enumerate(labels)}
    map_fn = np.vectorize(lambda x: label_to_id.get(x, -1))
    a = map_fn(a)
    b = map_fn(b)

    # filter NaN values
    M = np.vstack((a, b)).T  # 2 x N Matrix
    mask = M != -1
    a, b = M[np.all(mask, axis=1)].T

    # get indices and counts to populate confusion matrix
    cm = np.zeros((n_labels, n_labels), dtype=int)
    (i, j), counts = np.unique(np.vstack([a, b]), axis=1, return_counts=True)
    cm[i, j] = counts

    if return_labels:
        return cm, labels

    return cm


class NormalDistribution:
    """Continuous Normal Distribution.

    See: https://en.wikipedia.org/wiki/Normal_distribution
    """

    def __init__(self, location: float = 0.0, scale: float = 1.0):
        """Creates a NormalDistribution from the given parameters.
        Args:
            location: Location of the distribution.
            scale: Scale of the distribution. Must be positive.
        """
        if scale < 0.0:
            raise ValueError(f"scale parameter needs to be positive, but was {scale}")

        self.location = location
        self.scale = scale

    def cdf(self, x: float) -> float:
        """Cumulative Distribution Function of the Normal Distribution. Returns
        the probability that a random sample will be less than the given
        point.

        Args:
            x: Point within the distribution's domain.
        """
        return (1 + erf((x - self.location) / (self.scale * 2**0.5))) / 2

    def pdf(self, x: float) -> float:
        """Probability Density Function of the Normal Distribution. Returns the
        probability for observing the given sample in the distribution.

        Args:
            x: Point within the distribution's domain.
        """
        return np.exp(-0.5 * (x - self.location / self.scale) ** 2) / (
            self.scale * (2 * np.pi) ** 0.5
        )

    def ppf(self, p: float) -> float:
        """Probability Point function of the Normal Distribution. Returns
        the maximum point to which cumulated probabilities equal the given
        probability. Also called quantile. Inverse of the cdf.

        Args:
              p: Percentile of the distribution to be covered by the ppf.
        """
        if not (0.0 <= p <= 1.0):
            raise ValueError(f"p must be a float within [0.0, 1.0], but was {p}")

        return self.location + self.scale * 2**0.5 * erfinv(2 * p - 1.0)


def _distance_matrix(values, distance_fn, dtype=np.float64):
    """
    Calculates a matrix containing the distances between each pair of given
    values using the given distance function.

    Args:
        values: A sequence of values to compute distances between. Assumed to be
            unique.
        distance_fn: Function to calculate distance between two values. Calling
            `distance_fn(values[i], values[j])` must return a number.
        dtype: The datatype of the returned ndarray.

    Returns: The distance matrix as a 2d ndarray.
    """
    n = len(values)
    dist_matrix = np.zeros((n, n), dtype)
    i, j = np.triu_indices(n, k=1)
    distances = np.vectorize(distance_fn)(values[i], values[j])
    dist_matrix[i, j] = distances
    dist_matrix[j, i] = distances
    return dist_matrix


def _pair_indices(items: np.ndarray):
    """
    Returns indices of pairs of identical items. Indices are represented as a numpy ndarray, where the first row contains indices for the first parts of the pairs and the second row contains the second pair index.

    Args:
        items: The items for which to generate pair indices.

    Returns: A numpy ndarray, containing indices for pairs of identical items.
    """
    items = np.asarray(items)
    identical = (
        items[np.newaxis, ...] == items[..., np.newaxis]
    )  # elementwise comparison of each item. returns n*n indicator matrix
    return np.vstack(np.where(np.triu(identical, 1)))


def observed_and_expected_differences(items, values, distance_function):
    """
    Returns observed and expected differences for given annotations (item-value
    pairs), as used in Krippendorff's alpha agreement measure and the Sigma
    agreement measure.

    Args:
        items: Item Ids, identifying items of an annotation.
        values: Annotation value for a given item id. values[i] was assigned to
            items[i].
        distance_function: Function to calculate distance between two values.
            Calling `distance_fn(values[i], values[j])` must return a number.
            Can also be one of 'nominal', 'ordinal', 'interval' or 'ratio' for
            default functions pertaining to the level of measurement of the data.

    Returns:
        A tuple consisting of numpy ndarrays, containing the observed and expected differences in annotations.

    """
    items = np.asarray(items)
    values = np.asarray(values)

    if isinstance(distance_function, str):
        match distance_function:
            case "nominal":
                distance_function = lambda a, b: a != b
            case "ordinal":
                distance_function = lambda a, b: (a - b) ** 2
            case "interval":
                distance_function = lambda a, b: (a - b) ** 2
            case "ratio":
                distance_function = lambda a, b: ((a - b) / (a + b)) ** 2
            case _:
                raise ValueError(
                    f"Distance function '{distance_function}' not supported."
                )

    unique_values, value_ids = np.unique(values, return_inverse=True)
    dist_matrix = _distance_matrix(unique_values, distance_function)

    intra_item_pairs = _pair_indices(items)
    i, j = value_ids[intra_item_pairs]
    observed_differences = dist_matrix[i, j]

    all_item_pairs = np.vstack(np.triu_indices(n=items.size, k=1))
    i, j = value_ids[all_item_pairs]
    expected_differences = dist_matrix[i, j]

    return observed_differences, expected_differences


def records_from_annotations(
    annotations: np.ndarray, annotators=None, items=None, labels=None, nan_values=None
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Turns given annotations into sequences of records.

    Args:
        annotations: Annotation matrix (2d array) to convert. Columns represent
        annotators: List of annotator ids. Must be the same length as columns in annotations.
        items: List of item ids. Must be the same length as rows in annotations.
        labels: The to be included in the matrix.
        nan_values: Values in the records to be counted as invalid.
    Returns:
        Tuple containing arrays of item value ids, item ids and annotator ids
    """
    annotations = np.asarray(annotations)
    n_items, n_annotators = annotations.shape

    if items is None:
        items = np.arange(n_items)
    else:
        items = np.asarray(items)
        if len(items) != n_items:
            raise ValueError(
                "Number of items does not correspond to number of rows in annotations."
            )

    if annotators is None:
        annotators = np.arange(n_annotators)
    else:
        annotators = np.asarray(annotators)
        if len(annotators) != n_annotators:
            raise ValueError(
                "Number of annotators does not correspond to number of columns in annotations."
            )

    values = annotations.ravel()
    items = np.tile(items, n_annotators)
    annotators = np.tile(annotators, n_items)

    mask = _is_nan(values, nan_values)

    return values[mask], items[mask], annotators[mask]
