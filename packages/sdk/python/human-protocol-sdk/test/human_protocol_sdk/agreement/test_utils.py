import numpy as np

from human_protocol_sdk.agreement.utils import (
    confusion_matrix,
    label_counts,
    records_from_annotations,
)


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


def test_records_from_annotations(annotations_nan):
    values, items, annotators = records_from_annotations(annotations_nan)
    assert len(values) == len(items) == len(annotators)
