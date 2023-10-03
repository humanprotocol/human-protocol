from human_protocol_sdk.agreement.measures import (
    percentage,
    cohens_kappa,
    fleiss_kappa,
    agreement,
    krippendorffs_alpha,
    sigma,
)
from human_protocol_sdk.agreement.utils import (
    label_counts,
    observed_and_expected_differences,
)
import pytest

import numpy as np

from hypothesis import given, note, settings

from .conftest import (
    _incidence_matrix_generator,
    _confusion_matrix_generator,
    _eq_rounded,
)


def test_agreement(annotations, labels):
    # test if both interfaces match
    k_agree = agreement(annotations, measure="fleiss_kappa", labels=labels)["results"][
        "score"
    ]
    k_fleiss = fleiss_kappa(label_counts(annotations, labels))
    assert _eq_rounded(k_agree, k_fleiss)

    k_agree2 = agreement(
        label_counts(annotations, labels),
        measure="fleiss_kappa",
        data_format="label_counts",
        labels=labels,
    )["results"]["score"]
    assert _eq_rounded(k_agree, k_agree2)

    # test bootstrapping
    measure_kwargs = {"invalid_return": None}
    bootstrap_kwargs = {"n_sample": 30, "n_iterations": 500, "confidence_level": 0.9}
    res = agreement(
        annotations,
        measure="fleiss_kappa",
        labels=labels,
        bootstrap_method="percentile",
        measure_kwargs=measure_kwargs,
        bootstrap_kwargs=bootstrap_kwargs,
    )
    assert res["results"]["ci"] != (-100.0, -100.0)
    assert res["results"]["confidence_level"] != -100.0

    # test warnings
    with pytest.warns(UserWarning, match="Bootstrapping is currently not supported"):
        res = agreement(
            annotations,
            measure="cohens_kappa",
            labels=labels,
            bootstrap_method="percentile",
        )
        assert res["results"]["ci"] == (-100.0, -100.0)
        assert res["results"]["confidence_level"] == -100.0

    with pytest.warns(UserWarning, match="more than two annotators"):
        agreement(annotations, measure="cohens_kappa")

    # test errors
    with pytest.raises(ValueError, match="single annotator"):
        annos = np.asarray(annotations).reshape(-1, 1)
        agreement(annos, measure="cohens_kappa")

    with pytest.raises(ValueError, match="Combination of"):
        agreement(
            label_counts(annos), measure="cohens_kappa", data_format="label_counts"
        )

    with pytest.raises(ValueError, match="data format"):
        agreement(annos, data_format="foo")

    with pytest.raises(ValueError, match="Provided measure"):
        agreement(annos, measure="foo")


def test_percent_agreement(bin_2r_cm, bin_2r_im, single_anno_cm, wrong_dtype_cm):
    percent = percentage(bin_2r_cm, "cm")
    assert _eq_rounded(percent, 0.7)

    percentage_incidence = percentage(bin_2r_im, "im")
    assert _eq_rounded(percent, percentage_incidence)

    with pytest.raises(ValueError, match="have more than 1 annotation"):
        percentage(single_anno_cm, "cm")

    with pytest.raises(ValueError, match="must be a square"):
        percentage(bin_2r_im, "cm")

    with pytest.raises(ValueError, match="must be a numeric"):
        percentage(wrong_dtype_cm)


@given(im=_incidence_matrix_generator)
@settings(max_examples=5_000)
def test_percent_agreement_property(im):
    note(f"Example incidence matrix: {im}")
    result = percentage(im, "im")
    assert -1.0 <= result <= 1.0 or np.isnan(result)


def test_cohens_kappa(bin_2r_cm):
    kappa = cohens_kappa(bin_2r_cm)
    assert _eq_rounded(kappa, 0.348)


@given(cm=_confusion_matrix_generator)
@settings(max_examples=5_000)
def test_fleiss_kappa_property(cm):
    note(f"Example confusion matrix: {cm}")
    result = cohens_kappa(cm)
    assert -1.0 <= result <= 1.0 or np.isnan(result)


def test_fleiss_kappa(bin_mr_im):
    kappa = fleiss_kappa(bin_mr_im)
    assert _eq_rounded(kappa, 0.05)


@given(im=_incidence_matrix_generator)
@settings(max_examples=5_000)
def test_fleiss_kappa_property(im):
    note(f"Example incidence matrix: {im}")
    result = fleiss_kappa(im)
    assert -1.0 <= result <= 1.0 or np.isnan(result)


def test_invalid_return():
    invalid = "INVALID"
    assert cohens_kappa([[5]], invalid) == invalid
    assert fleiss_kappa([[5], [np.nan]], invalid) == invalid


def test_krippendorff():
    items = np.asarray(["a", "a", "a", "b", "b", "b"])
    values = np.asarray(["foo", "foo", "foo", "foo", "bar", "bar"])
    d = lambda a, b: float(a != b)
    assert 0.375 == krippendorffs_alpha(items, values, distance_function=d)


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
    values = annotations.ravel()
    items = np.repeat(np.arange(n_items), n_annotators)
    assert 1.0 == sigma(items, values, d)

    # worst case, no better than chance, should be 0.0, within difference is no different than between.
    annotations = np.ones((n_items, n_annotators))
    means = np.arange(n_annotators)[np.newaxis, ...]
    scales = np.arange(n_annotators)[np.newaxis, ...] * 3
    annotations = annotations * scales + means
    values = annotations.ravel()
    items = np.repeat(np.arange(n_items), n_annotators)
    assert 0.0 == sigma(items, values, d)

    # somewhere inbetween
    annotations = np.random.rand(n_items, n_annotators)
    means = np.random.rand(n_items, 1) * 100
    scales = np.random.randn(n_items, 1) * 10
    annotations = annotations * scales + means
    values = annotations.ravel()
    items = np.repeat(np.arange(n_items), n_annotators)

    assert 0.0 <= sigma(items, values, d) <= 1.0

    # p is the criterion for significant difference. as it goes up, it becomes more lenient, so sigma value should increase
    previous = 0.0
    for p in np.arange(1, 10) * 0.1:
        s = sigma(items, values, d, p)
        assert s >= previous
        previous = s
