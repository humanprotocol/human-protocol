import numpy as np
import pytest
from hypothesis import given, note, settings

from human_protocol_sdk.agreement.measures import (
    percentage,
    cohens_kappa,
    fleiss_kappa,
    agreement,
    krippendorffs_alpha,
    sigma,
)
from .conftest import (
    eq_rounded,
    annotation_generator,
)


def test_agreement(annotations_nan, labels):
    # test if both interfaces match
    k_agree = agreement(annotations_nan, measure="fleiss_kappa")["results"]["score"]
    k_fleiss = fleiss_kappa(annotations_nan)
    assert eq_rounded(k_agree, k_fleiss)

    # test bootstrapping
    measure_kwargs = {"distance_function": "nominal"}
    bootstrap_kwargs = {"n_sample": 30, "n_iterations": 500, "confidence_level": 0.9}
    res = agreement(
        annotations_nan,
        measure="krippendorffs_alpha",
        labels=labels,
        bootstrap_method="percentile",
        measure_kwargs=measure_kwargs,
        bootstrap_kwargs=bootstrap_kwargs,
    )
    assert res["results"]["ci"] != (-100.0, -100.0)
    assert res["results"]["confidence_level"] != -100.0

    with pytest.raises(ValueError, match="Provided measure"):
        agreement(annotations_nan, measure="foo")


def test_percent_agreement(annotations, annotations_nan, annotations_2_raters):
    assert percentage(annotations_2_raters) == 0.7
    assert eq_rounded(percentage(annotations), 0.667, 3)
    assert eq_rounded(percentage(annotations_nan), 0.7, 3)


def test_cohens_kappa(annotations_2_raters):
    kappa = cohens_kappa(annotations_2_raters)
    assert eq_rounded(kappa, 0.348)


def test_fleiss_kappa(annotations_multiple_raters):
    kappa = fleiss_kappa(annotations_multiple_raters)
    assert eq_rounded(kappa, 0.05)

    single_class_annos = np.zeros((10, 3))  # all annotators gave the same labels
    assert ~np.isnan(fleiss_kappa(single_class_annos))

    single_annotator_annos = np.random.randint(0, 2, size=(10, 1))
    assert ~np.isnan(fleiss_kappa(single_annotator_annos))


def test_krippendorff():
    annotations = np.asarray([[0, 0, 0], [0, 1, 1]])
    d = lambda a, b: float(a != b)
    assert 0.375 == krippendorffs_alpha(annotations, distance_function=d)


def test_sigma():
    np.random.seed(42)
    n_items = 500
    n_annotators = 5
    d = lambda x, y: (x - y) ** 2

    # best case, should be 1.0. difference for same items is identical, but between very high.
    annotations = np.ones((n_items, n_annotators))
    means = np.arange(n_items)[..., np.newaxis] * 5
    scales = np.arange(n_items)[..., np.newaxis] * 3
    annotations = annotations * scales + means
    assert 1.0 == sigma(annotations, d)

    # worst case, no better than chance, should be 0.0, within difference is no different than between.
    annotations = np.ones((n_items, n_annotators))
    means = np.arange(n_annotators)[np.newaxis, ...]
    scales = np.arange(n_annotators)[np.newaxis, ...] * 3
    annotations = annotations * scales + means
    assert 0.0 == sigma(annotations, d)

    # somewhere inbetween
    annotations = np.random.rand(n_items, n_annotators)
    means = np.random.rand(n_items, 1) * 100
    scales = np.random.randn(n_items, 1) * 10
    annotations = annotations * scales + means
    assert 0.0 <= sigma(annotations, d)

    # p is the criterion for significant difference. as it goes up, it becomes more lenient, so sigma value should increase
    previous = 0.0
    for p in np.arange(1, 10) * 0.1:
        s = sigma(annotations, d, p)
        assert s >= previous
        previous = s


@given(annos=annotation_generator)
@settings(max_examples=1_000)
def test_properties(annos):
    note(f"Example annotations: {annos}")
    assert -1.0 <= fleiss_kappa(annos) <= 1.0
    assert 0.0 <= percentage(annos) <= 1.0
