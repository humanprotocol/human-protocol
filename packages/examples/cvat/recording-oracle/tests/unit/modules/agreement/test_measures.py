from modules.agreement.measures import percent_agreement, cohens_kappa, fleiss_kappa


def _eq_rounded(a, b, ndigits=3):
    return round(a, ndigits) == round(b, ndigits)


def test_percent_agreement(bin_2r_cm, bin_2r_im):
    percentage = percent_agreement(bin_2r_cm, 'cm')
    assert _eq_rounded(percentage, 0.7)

    percentage_incidence = percent_agreement(bin_2r_im,'im')
    assert _eq_rounded(percentage, percentage_incidence)


def test_cohens_kappa(bin_2r_cm):
    kappa = cohens_kappa(bin_2r_cm)
    assert _eq_rounded(kappa, 0.348)


def test_fleiss_kappa(bin_mr_im):
    kappa = fleiss_kappa(bin_mr_im)
    assert _eq_rounded(kappa, 0.05)