"""Module containing helper functions for calculating agreement measures."""

from collections import Counter
from math import nan
from typing import Sequence, Optional, Tuple

import numpy as np
from pyerf import erf, erfinv


def _filter_labels(labels: Sequence):
    """
    Filters None and nan values from the given labels.

    :param labels: The labels to filter.

    :return: A list of labels without the given list of labels to exclude.

    """
    # map to preserve label order if user defined labels are passed
    nan_values = {np.nan, nan, None, "nan"}
    return np.asarray([label for label in labels if label not in nan_values])


def _is_nan(data: np.ndarray, axis=None):
    """np.isnan but for any data type."""
    try:
        mask = np.isnan(data)
    except TypeError:
        mask = data == "nan"

    if axis is not None:
        mask = np.any(mask, axis=axis)

    return mask


def _is_in(data: np.ndarray, elements: np.ndarray):
    """Checks if data is in elements. Faster than using np.isin."""
    return data[..., np.newaxis] == elements


def label_counts(
    annotations: Sequence,
    labels=None,
    return_labels=False,
):
    """Converts the given sequence of item annotations to an array of label counts per item.

    :param annotations: A two-dimensional sequence. Rows represent items, columns represent annotators.
    :param labels: List of labels to be counted. Entries not found in the list are omitted. If
        omitted, all labels in the annotations are counted.
    :param nan_values: Values in the records to be counted as invalid.
    :param return_labels: Whether to return labels with the counts. Automatically set to true if labels are
        inferred.

    :return: A two-dimensional array of integers. Rows represent items, columns represent labels.

    :example:
        .. code-block:: python

            from human_protocol_sdk.agreement.utils import label_counts

            annotations = [
                ["white", "black", "white"],
                ["white", "white", "white"],
                ["black", "black", "black"],
                ["white",   "nan", "black"],
            ]

            # infer labels automatically
            counts, labels = label_counts(annotations, return_labels=True)
            print(counts)
            # [[1 2]
            #  [0 3]
            #  [3 0]
            #  [1 1]]

            # labels are inferred and sorted automatically
            print(labels)
            # ['black' 'white']

        .. code-block:: python

            # labels are provided, label order is preserved
            counts, labels = label_counts(
                annotations,
                labels=['white', 'black'],
                return_labels=True
            )
            print(counts)
            # [[2 1]
            #  [3 0]
            #  [0 3]
            #  [1 1]]

            print(labels)
            # ['white' 'black']

        .. code-block:: python

            # can be achieved using nan values
            counts, labels = label_counts(
                annotations,
                nan_values=[''],
                return_labels=True
            )

            print(counts)
            # [[1 2]
            #  [0 3]
            #  [3 0]
            #  [1 1]]

            print(labels)
            # ['black' 'white']

    """
    annotations = np.asarray(annotations)

    if labels is None:
        labels = np.unique(annotations)

    labels = _filter_labels(labels)

    def lcs(annotations, labels):
        c = Counter(annotations)
        return [c.get(label, 0) for label in labels]

    counts = np.asarray([lcs(row, labels) for row in annotations])

    if return_labels:
        return counts, labels

    return counts


def confusion_matrix(
    annotations: np.ndarray,
    labels: Optional[Sequence] = None,
    return_labels=False,
):
    """Generate an N X N confusion matrix from the given sequence of values a and b,
    where N is the number of unique labels.

    :param annotations: Annotation data to be converted into confusion matrix.
        Must be a N x 2 Matrix, where N is the number of items and 2 is the number of annotators.
    :param labels: Sequence of labels to be counted.
        Entries not found in the list are omitted.
        No labels are provided, the list of labels is inferred from the given annotations.
    :param return_labels: Whether to return labels with the counts.

    :return: A confusion matrix.
        Rows represent labels assigned by b, columns represent labels assigned by a.

    :example:
        .. code-block:: python

            from human_protocol_sdk.agreement.utils import confusion_matrix
            import numpy as np

            annotations = np.asarray([
                ["a", "a"],
                ["b", "a"],
                ["c", "c"]
            ])

            # infer labels automatically
            cm = confusion_matrix(annotations, return_labels=False)
            print(cm)
            # [[1 0 0]
            #  [1 0 0]
            #  [0 0 1]]
    """
    annotations = np.asarray(annotations)

    # create list of unique labels
    if labels is None:
        labels = np.unique(annotations)

    labels = _filter_labels(labels)
    n_labels = len(labels)

    # map labels to ids
    label_to_id = {label: i for i, label in enumerate(labels)}
    map_fn = np.vectorize(lambda x: label_to_id.get(x, -1))
    M = map_fn(annotations)

    # filter NaN values
    mask = np.all(M != -1, axis=1)

    # get indices and counts to populate confusion matrix
    cm = np.zeros((n_labels, n_labels), dtype=int)
    (i, j), counts = np.unique(M[mask].T, axis=1, return_counts=True)
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

        :param location: Location of the distribution.
        :param scale: Scale of the distribution. Must be positive.
        """
        if scale < 0.0:
            raise ValueError(f"scale parameter needs to be positive, but was {scale}")

        self.location = location
        self.scale = scale

    def cdf(self, x: float) -> float:
        """Cumulative Distribution Function of the Normal Distribution. Returns
        the probability that a random sample will be less than the given
        point.

        :param x: Point within the distribution's domain.
        """
        return (1 + erf((x - self.location) / (self.scale * 2**0.5))) / 2

    def pdf(self, x: float) -> float:
        """Probability Density Function of the Normal Distribution. Returns the
        probability for observing the given sample in the distribution.

        :param x: Point within the distribution's domain.
        """
        return np.exp(-0.5 * (x - self.location / self.scale) ** 2) / (
            self.scale * (2 * np.pi) ** 0.5
        )

    def ppf(self, p: float) -> float:
        """Probability Point function of the Normal Distribution. Returns
        the maximum point to which cumulated probabilities equal the given
        probability. Also called quantile. Inverse of the cdf.

        :param p: Percentile of the distribution to be covered by the ppf.
        """
        if not (0.0 <= p <= 1.0):
            raise ValueError(f"p must be a float within [0.0, 1.0], but was {p}")

        return self.location + self.scale * 2**0.5 * erfinv(2 * p - 1.0)


def _distance_matrix(values, distance_fn, dtype=np.float64):
    """
    Calculates a matrix containing the distances between each pair of given
    values using the given distance function.

    :param values: A sequence of values to compute distances between. Assumed to be
        unique.
    :param distance_fn: Function to calculate distance between two values. Calling
        `distance_fn(values[i], values[j])` must return a number.
    :param dtype: The datatype of the returned ndarray.

    :return: The distance matrix as a 2d ndarray.
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

    :param items: The items for which to generate pair indices.

    :return: A numpy ndarray, containing indices for pairs of identical items.
    """
    items = np.asarray(items)
    identical = (
        items[np.newaxis, ...] == items[..., np.newaxis]
    )  # elementwise comparison of each item. returns n*n indicator matrix
    return np.vstack(np.where(np.triu(identical, 1)))


def observed_and_expected_differences(annotations, distance_function):
    """
    Returns observed and expected differences for given annotations (item-value
    pairs), as used in Krippendorff's alpha agreement measure and the Sigma
    agreement measure.

    :param annotations: Annotation data.
        Must be a N x M Matrix, where N is the number of items and M is the number of annotators.
    :param distance_function: Function to calculate distance between two values.
        Calling `distance_fn(annotations[i, j], annotations[p, q])` must return a number.
        Can also be one of 'nominal', 'ordinal', 'interval' or 'ratio' for
        default functions pertaining to the level of measurement of the data.

    :return: A tuple consisting of numpy ndarrays,
        containing the observed and expected differences in annotations.

    """
    values, items, _ = records_from_annotations(annotations)

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
    annotations: np.ndarray, annotators=None, items=None, labels=None
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Turns given annotations into sequences of records.

    :param annotations: Annotation matrix (2d array) to convert. Columns represent
    :param annotators: List of annotator ids. Must be the same length as columns in annotations.
    :param items: List of item ids. Must be the same length as rows in annotations.
    :param labels: The to be included in the matrix.

    :return: Tuple containing arrays of item value ids, item ids and annotator ids

    :example:
        .. code-block:: python

            from human_protocol_sdk.agreement.utils import records_from_annotations
            import numpy as np

            annotations = np.asarray([
                ["cat", "not", "cat"],
                ["cat", "cat", "cat"],
                ["not", "not", "not"],
                ["cat", np.nan, "not"],
            ])

            # nan values are automatically filtered
            values, items, annotators = records_from_annotations(annotations)
            print(values)
            # ['cat' 'not' 'cat' 'cat' 'cat' 'cat' 'not' 'not' 'not' 'cat' 'not']
            print(items)
            # [0 0 0 1 1 1 2 2 2 3 3]
            print(annotators)
            # [0 1 2 0 1 2 0 1 2 0 2]

        .. code-block:: python

            annotators = np.asarray(["bob", "alice", "charlie"])
            items = np.asarray(["item_1", "item_2", "item_3", "item_4"])

            values, items, annotators = records_from_annotations(
                annotations,
                annotators,
                items
            )
            print(values)
            # ['cat' 'not' 'cat' 'cat' 'cat' 'cat' 'not' 'not' 'not' 'cat' 'not']
            print(items)
            # ['item_1' 'item_1' 'item_1' 'item_2' 'item_2' 'item_2' 'item_3' 'item_3' 'item_3' 'item_4' 'item_4']
            print(annotators)
            # ['bob' 'alice' 'charlie' 'bob' 'alice' 'charlie' 'bob' 'alice' 'charlie' 'bob' 'charlie']
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
    items = np.repeat(items, n_annotators)
    annotators = np.tile(annotators, n_items)

    mask = ~_is_nan(values)

    return values[mask], items[mask], annotators[mask]
