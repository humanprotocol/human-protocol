import pytest
from human_protocol_sdk.agreement.utils import (
    confusion_matrix,
    label_counts,
    records_from_annotations,
)
import numpy as np


def test_confusion_matrix_from_sequence(
    seq_values, seq_labels, seq_labels_nan, seq_labels_long, bin_2r_cm
):
    assert np.all(confusion_matrix(seq_values, seq_values) == np.eye(4))
    res = np.eye(3)
    res[0, 0] = 0
    assert np.all(
        confusion_matrix(seq_labels, seq_labels_nan, nan_values=["nan"]) == res
    )

    with pytest.raises(ValueError, match="same shape"):
        confusion_matrix(seq_labels_long, seq_labels_nan)

    with pytest.raises(ValueError, match="1-dimensional"):
        confusion_matrix(seq_values, bin_2r_cm)

    with pytest.raises(ValueError, match="must have the same kind of dtype"):
        confusion_matrix(seq_values, seq_labels_nan)


def test_label_counts_from_annotations(annotations, labels):
    counts = label_counts(annotations, labels, return_labels=False)

    true_counts = np.asarray(
        [
            [2, 1],
            [3, 0],
            [0, 3],
            [1, 1],
        ]
    )

    assert np.all(counts == true_counts)

    counts, labels = label_counts(annotations, nan_values=[], return_labels=True)

    # empty label is now counted as well
    true_counts = np.asarray([[0, 1, 2], [0, 0, 3], [0, 3, 0], [1, 1, 1]])

    assert np.all(counts == true_counts)


def test_label_counts_from_annotations(annotations, labels):
    counts = label_counts(annotations, labels, return_labels=False)

    true_counts = np.asarray(
        [
            [2, 1],
            [3, 0],
            [0, 3],
            [1, 1],
        ]
    )

    assert np.all(counts == true_counts)

    counts, labels = label_counts(annotations, nan_values=[], return_labels=True)

    # empty label is now counted as well
    true_counts = np.asarray([[0, 1, 2], [0, 0, 3], [0, 3, 0], [1, 1, 1]])

    assert np.all(counts == true_counts)


def test_records_from_annotations(annotations):
    values, items, annotators = records_from_annotations(annotations)
    assert len(values) == len(items) == len(annotators)

    n_unfiltered = len(values)
    values, _, _ = records_from_annotations(annotations, nan_values=[""])
    assert len(values) == n_unfiltered - 1

    annotations[-1][-2] = np.nan
    values, _, _ = records_from_annotations(annotations, nan_values=np.nan)
    assert len(values) == n_unfiltered - 1
