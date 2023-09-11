from human_protocol_sdk.agreement import (
    percentage,
    cohens_kappa,
    fleiss_kappa,
    agreement,
)
from human_protocol_sdk.agreement.utils import label_counts
import pytest

import numpy as np

from hypothesis import given, note, settings

from .conftest import (
    _incidence_matrix_generator,
    _confusion_matrix_generator,
    _eq_rounded,
)


def test_agreement(annotations, labels):
    k_agree = agreement(annotations, method="fleiss_kappa", labels=labels)["score"]
    k_fleiss = fleiss_kappa(label_counts(annotations, labels))

    assert _eq_rounded(k_agree, k_fleiss)

    agreement(annotations, method="cohens_kappa", labels=labels)


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
