import numpy as np
import pytest
from hypothesis import given, note, settings

from src.agreement import cohens_kappa, fleiss_kappa, percent_agreement

from tests.unit.agreement.conftest import (
    _confusion_matrix_generator,
    _eq_rounded,
    _incidence_matrix_generator,
)


def test_percent_agreement(bin_2r_cm, bin_2r_im, single_anno_cm, wrong_dtype_cm):
    percentage = percent_agreement(bin_2r_cm, "cm")
    assert _eq_rounded(percentage, 0.7)

    percentage_incidence = percent_agreement(bin_2r_im, "im")
    assert _eq_rounded(percentage, percentage_incidence)

    with pytest.raises(ValueError, match="have more than 1 annotation"):
        percent_agreement(single_anno_cm, "cm")

    with pytest.raises(ValueError, match="must be a square"):
        percent_agreement(bin_2r_im, "cm")

    with pytest.raises(ValueError, match="must be a numeric"):
        percent_agreement(wrong_dtype_cm)


@given(im=_incidence_matrix_generator)
@settings(max_examples=5_000)
def test_percent_agreement_property(im):
    note(f"Example incidence matrix: {im}")
    result = percent_agreement(im, "im")
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
    assert fleiss_kappa([[5], [0]], invalid) == invalid
    assert percent_agreement([[5], [0]], invalid_return=invalid) == invalid
