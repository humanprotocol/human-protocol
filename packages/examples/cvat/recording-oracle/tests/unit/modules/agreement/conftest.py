import pytest
import numpy as np


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
    return np.asarray(
        [[3, 0], [2, 1], [2, 1], [2, 1], [1, 2], [0, 3], [0, 3], [1, 2], [1, 2], [1, 2]]
    )


@pytest.fixture
def single_anno_cm() -> np.ndarray:
    return np.asarray([[1, 0], [0, 0]])


@pytest.fixture
def wrong_dtype_cm() -> np.ndarray:
    return np.asarray([[1.0, 2.0], [3.0, 4.0]])
