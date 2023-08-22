import numpy as np
from src.agreement.bootstrap import bootstrap_ci
from tests.unit.agreement.conftest import _eq_rounded


def test_bootstrap_percentage(normal_sample):
    ci, statistics_bootstrap = bootstrap_ci(
        data=normal_sample,
        statistic_fn=np.mean,
        n_iterations=5_000,
        n_sample=1_000,
        ci=0.95,
        algorithm="percentile",
    )

    assert len(statistics_bootstrap) == 5_000
    assert _eq_rounded(np.mean(statistics_bootstrap), 0.0, 1)

    low, high = ci
    assert low < np.mean(statistics_bootstrap) < high
