import pytest
from human_protocol_sdk.agreement.utils import (
    confusion_matrix_from_sequence,
    label_counts,
)
import numpy as np


def test_confusion_matrix_from_sequence(
    seq_values, seq_labels, seq_labels_nan, seq_labels_long, bin_2r_cm
):
    assert np.all(confusion_matrix_from_sequence(seq_values, seq_values) == np.eye(4))
    assert np.all(
        confusion_matrix_from_sequence(seq_labels, seq_labels_nan) == np.eye(2)
    )

    with pytest.raises(ValueError, match="same shape"):
        confusion_matrix_from_sequence(seq_labels_long, seq_labels_nan)

    with pytest.raises(ValueError, match="1-dimensional"):
        confusion_matrix_from_sequence(seq_values, bin_2r_cm)

    with pytest.raises(ValueError, match="must have the same kind of dtype"):
        confusion_matrix_from_sequence(seq_values, seq_labels_nan)


def test_label_counts_from_annotations(annotations, labels):
    counts = label_counts(annotations, labels, False)

    true_counts = np.asarray(
        [
            [2, 1],
            [3, 0],
            [0, 3],
            [1, 1],
        ]
    )

    assert np.all(counts == true_counts)

    counts, labels = label_counts(annotations, None)

    # empty label is now counted as well
    true_counts = np.asarray([[0, 1, 2], [0, 0, 3], [0, 3, 0], [1, 1, 1]])

    assert np.all(counts == true_counts)
