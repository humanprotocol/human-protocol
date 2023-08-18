from src.modules.agreement.measures import percent_agreement, cohens_kappa, fleiss_kappa
import pytest


def _eq_rounded(a, b, n_digits=3):
    return round(a, n_digits) == round(b, n_digits)


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


def test_cohens_kappa(bin_2r_cm):
    kappa = cohens_kappa(bin_2r_cm)
    assert _eq_rounded(kappa, 0.348)


def test_fleiss_kappa(bin_mr_im):
    kappa = fleiss_kappa(bin_mr_im)
    assert _eq_rounded(kappa, 0.05)
