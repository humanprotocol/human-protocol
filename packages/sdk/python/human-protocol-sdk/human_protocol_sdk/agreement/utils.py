import numpy as np
from collections import Counter
from math import nan
from typing import Sequence, Optional

from pyerf import erf, erfinv

from .validations import (
    validate_nd,
    validate_equal_shape,
    validate_same_dtype,
)


def label_counts(annotations: Sequence, labels=None, return_labels=False):
    """Converts the given sequence of item annotations to an array of label counts per item.

    Args:
        annotations: A two-dimensional sequence. Rows represent items, columns represent annotators.
        labels: List of labels to be counted. Entries not found in the list are omitted. If
            omitted, all labels in the annotations are counted.
        return_labels: Whether to return labels with the counts. Automatically set to true if labels are
            inferred.

    Returns:
        A two-dimensional array of integers. Rows represent items, columns represent labels. If
    """
    annotations = np.asarray(annotations)

    if labels is None:
        labels = np.unique(annotations)
        return_labels = True

    def lcs(annotations, labels):
        c = Counter(annotations)
        return [c.get(label, 0) for label in labels]

    counts = np.asarray([lcs(row, labels) for row in annotations])

    if return_labels:
        return counts, labels

    return counts


def confusion_matrix_from_sequence(
    a: Sequence,
    b: Sequence,
    labels: Optional[Sequence] = None,
    nan_values: Optional[Sequence] = None,
    return_labels=False,
):
    """Generate an N X N confusion matrix from the given sequence of values
        a and b, where N is the number of unique labels.

    Args:
        a: A sequence of labels.
        b: Another sequence of labels.
        labels: The to be included in the matrix.
        nan_values: Values in the records to be counted as invalid.
        return_labels: Whether to return labels used in the confusion matrix.
    """
    a = np.asarray(a)
    b = np.asarray(b)

    validate_same_dtype(a, b)
    validate_nd(a, 1)
    validate_nd(b, 1)
    validate_equal_shape(a, b)

    # define nan values if not explicitly passed
    if nan_values is None:
        if a.dtype.kind in "UO":
            nan_values = [None, "", "None", "nan"]
        else:
            nan_values = [np.nan, None, nan]

    # create list of unique labels
    if labels is None:
        labels = np.unique(np.concatenate([a, b]))
    else:
        labels = np.asarray(labels)

    mask = ~np.isin(labels, nan_values)
    labels = labels[mask]

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
    confusion_matrix = np.zeros((labels.size, labels.size), dtype=int)
    ijs, counts = np.unique(np.vstack([a, b]), axis=1, return_counts=True)
    confusion_matrix[ijs[0], ijs[1]] = counts

    if return_labels:
        return confusion_matrix, labels

    return confusion_matrix


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
