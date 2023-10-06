import numpy as np
import pytest
from hypothesis.strategies import tuples, integers


@pytest.fixture
def annotations():
    return [
        ["cat", "not", "cat"],
        ["cat", "cat", "cat"],
        ["not", "not", "not"],
        ["cat", "cat", "not"],
    ]


@pytest.fixture
def annotations_nan():
    return [
        ["cat", "not", "cat"],
        ["cat", "cat", "cat"],
        ["not", "not", "not"],
        ["cat", "nan", "not"],
    ]


@pytest.fixture
def annotations_2_raters():
    return [
        ["cat", "cat"],
        ["cat", "cat"],
        ["not", "cat"],
        ["not", "cat"],
        ["cat", "not"],
        ["not", "not"],
        ["not", "not"],
        ["not", "not"],
        ["not", "not"],
        ["not", "not"],
    ]


@pytest.fixture
def labels():
    return ["cat", "not"]


@pytest.fixture
def annotations_multiple_raters() -> np.ndarray:
    return np.asarray(
        [
            [0, 0, 0],
            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 0],
            [1, 1, 0],
            [0, 1, 1],
        ]
    )


annotation_generator = tuples(integers(1, 500), integers(1, 10), integers(1, 5)).map(
    lambda xs: np.random.randint(0, xs[2], size=(xs[0], xs[1]))
)


@pytest.fixture
def normal_sample():
    return np.random.randn(10_000)


def eq_rounded(a, b, n_digits=3):
    return round(a, n_digits) == round(b, n_digits)
