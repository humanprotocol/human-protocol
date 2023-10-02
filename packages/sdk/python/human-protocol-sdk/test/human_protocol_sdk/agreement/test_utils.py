import pytest
from human_protocol_sdk.agreement.utils import (
    confusion_matrix,
    label_counts,
    records_from_annotations,
)
import numpy as np


def test_confusion_matrix():
    annotations = np.asarray([["a", "a"], ["b", "b"], ["c", "c"]])
    assert np.all(confusion_matrix(annotations) == np.eye(3))

    annotations = np.asarray([["b", np.nan], ["b", "b"], ["c", "c"]])
    assert np.all(confusion_matrix(annotations) == np.eye(2))


def test_label_counts_from_annotations(annotations_nan, labels):
    counts = label_counts(annotations_nan, labels)

    true_counts = np.asarray(
        [
            [2, 1],
            [3, 0],
            [0, 3],
            [1, 1],
        ]
    )

    assert np.all(counts == true_counts)

    # sorting is applied
    true_counts = np.asarray(
        [
            [1, 2],
            [0, 3],
            [3, 0],
            [1, 1],
        ]
    )

    counts = label_counts(annotations_nan)
    assert np.all(counts == true_counts)


def test_records_from_annotations(annotations_nan):
    values, items, annotators = records_from_annotations(annotations_nan)
    assert len(values) == len(items) == len(annotators)

    n_unfiltered = len(values)
    values, _, _ = records_from_annotations(annotations_nan, nan_values=[""])
    assert len(values) == n_unfiltered - 1

    annotations_nan[-1][-2] = np.nan
    values, _, _ = records_from_annotations(annotations_nan, nan_values=np.nan)
    assert len(values) == n_unfiltered - 1
