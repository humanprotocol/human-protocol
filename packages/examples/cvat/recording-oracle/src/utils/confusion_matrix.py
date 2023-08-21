import numpy as np
from typing import Sequence, Optional
from src.agreement.validations import (
    validate_nd,
    validate_equal_shape,
    validate_same_dtype,
)


def confusion_matrix_from_sequence(
    a: Sequence, b: Sequence, labels: Optional[Sequence] = None
):
    """Generate an N X N confusion matrix from the given sequence of values
        a and b, where N is the number of unique labels.

    Args:
        a: A sequence of labels.
        b: Another sequence of labels.
        labels: The labels contained in the records. Must contain all labels in
            the given records and may contain labels that are not found in the
            records.
    """
    a = np.asarray(a)
    b = np.asarray(b)

    validate_same_dtype(a, b)
    validate_nd(a, 1)
    validate_nd(b, 1)
    validate_equal_shape(a, b)

    # filter NaN values
    M = np.vstack((a, b)).T  # 2 x N Matrix
    if M.dtype.kind in "UO":  # string types
        mask = M != "nan"
    else:
        mask = ~np.isnan(M)
    a, b = M[np.all(mask, axis=1)].T

    # create list of unique labels
    if labels is None:
        labels = np.concatenate([a, b])
    labels = np.unique(labels)

    # convert labels to indices
    label_to_id = {label: i for i, label in enumerate(labels)}
    map_fn = np.vectorize(lambda x: label_to_id[x])
    a = map_fn(a)
    b = map_fn(b)

    # get indices and counts to populate confusion matrix
    confusion_matrix = np.zeros((labels.size, labels.size), dtype=int)
    ijs, counts = np.unique(np.vstack([a, b]), axis=1, return_counts=True)
    confusion_matrix[ijs[0], ijs[1]] = counts

    return confusion_matrix
