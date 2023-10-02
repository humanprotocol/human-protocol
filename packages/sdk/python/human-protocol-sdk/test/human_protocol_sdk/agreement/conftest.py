import pytest
import numpy as np
from hypothesis.strategies import tuples, integers, builds, just


@pytest.fixture
def annotations():
    return [
        ["white", "black", "white"],  # 1 / 3
        ["white", "white", "white"],  # 3 / 3
        ["black", "black", "black"],  # 3 / 3
        ["white", "white", "black"],  # 1 / 3
    ]


@pytest.fixture
def annotations_nan():
    return [
        ["white", "black", "white"],
        ["white", "white", "white"],
        ["black", "black", "black"],
        ["white", "nan", "black"],
    ]


@pytest.fixture
def annotations_2_raters():
    return [
        ["white", "white"],
        ["white", "white"],
        ["black", "white"],
        ["black", "white"],
        ["white", "black"],
        ["black", "black"],
        ["black", "black"],
        ["black", "black"],
        ["black", "black"],
        ["black", "black"],
    ]


@pytest.fixture
def labels():
    return ["white", "black"]


@pytest.fixture
def bin_2r_cm() -> np.ndarray:
    """
    Returns a confusion matrix (rater_a x rater_b) for a binary classification
    problem with two raters.
    """
    return np.asarray([[2, 2], [1, 5]])


@pytest.fixture
def bin_2r_im() -> np.ndarray:
    """
    Returns an incidence matrix (item x class) for a binary classification
    problem with two raters.
    """
    return np.asarray(
        [[2, 0], [2, 0], [1, 1], [1, 1], [1, 1], [0, 2], [0, 2], [0, 2], [0, 2], [0, 2]]
    )


@pytest.fixture
def bin_mr_im() -> np.ndarray:
    """
    Returns an incidence matrix (item x class) for a binary classification
    problem with multiple raters.
    """
    return np.asarray(
        [[3, 0], [2, 1], [2, 1], [2, 1], [1, 2], [0, 3], [0, 3], [1, 2], [1, 2], [1, 2]]
    )


@pytest.fixture
def single_anno_cm() -> np.ndarray:
    """Returns a confusion matrix with only a single annotation."""
    return np.asarray([[1, 0], [0, 0]])


@pytest.fixture
def wrong_dtype_cm() -> np.ndarray:
    """Returns a confusion matrix with the wrong dtype."""
    return np.asarray([["a", "b"], ["c", "d"]])


@pytest.fixture
def seq_labels():
    """Returns sequence containing labels."""
    return np.asarray(["a", "b", "c"])


@pytest.fixture
def seq_labels_nan():
    """Returns a sequence containing labels and nan values."""
    return np.asarray([np.NaN, "b", "c"])


@pytest.fixture
def seq_values():
    """Returns a sequence containing values."""
    return [1, 2, 3, 4]


@pytest.fixture
def seq_labels_long():
    """Returns a sequence containing more values."""
    return np.asarray(["e", "f", "g", "h"])


@pytest.fixture
def normal_sample():
    return np.random.randn(10_000)


_incidence_matrix_generator = tuples(integers(1, 500), integers(2, 50)).map(
    lambda xs: np.random.randint(0, 100, size=xs)
)
_confusion_matrix_generator = integers(2).map(
    lambda x: np.random.randint(0, 100, size=(x, x))
)

_annotation_generator = tuples(integers(1, 500), integers(2, 10), integers(2, 5)).map(
    lambda xs: np.random.randint(0, xs[2], size=(xs[0], xs[1]))
)


def _eq_rounded(a, b, n_digits=3):
    return round(a, n_digits) == round(b, n_digits)
