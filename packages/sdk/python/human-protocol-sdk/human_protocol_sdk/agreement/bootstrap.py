"""Module containing methods to calculate confidence intervals using bootstrapping."""

import random

import numpy as np
from typing import Sequence, Callable, Optional, Tuple
from warnings import warn

from human_protocol_sdk.agreement.utils import NormalDistribution


def confidence_intervals(
    data: Sequence,
    statistic_fn: Callable,
    n_iterations: int = 1000,
    n_sample: Optional[int] = None,
    confidence_level=0.95,
    algorithm="bca",
    seed=None,
) -> Tuple[Tuple[float, float], np.ndarray]:
    """Returns a tuple, containing the confidence interval for the boostrap estimates of the given statistic and statistics of the bootstrap samples.

    :param data: Data to estimate the statistic.
    :param statistic_fn: Function to calculate the statistic. statistic_fn(data) must return a number.
    :param n_iterations: Number of bootstrap samples to use for the estimate.
    :param n_sample: If provided, determines the size of each bootstrap sample
        drawn from the data. If omitted, is equal to the length of the data.
    :param confidence_level: Size of the confidence interval.
    :param algorithm: Which algorithm to use for the confidence interval
        estimation. "bca" uses the "Bias Corrected Bootstrap with
        Acceleration", "percentile" simply takes the appropriate
        percentiles from the bootstrap distribution.
    :param seed: Random seed to use.

    :return: Confidence interval and bootstrap distribution.

    :example:
        .. code-block:: python

                from human_protocol_sdk.agreement.bootstrap import confidence_interval
                import numpy as np

                np.random.seed(42)
                data = np.random.randn(10_000)
                fn = np.mean
                sample_mean = fn(data)
                print(f"Sample mean is {sample_mean:.3f}")
                # Sample mean is -0.002

                cl = 0.99
                ci, _ = confidence_interval(data, fn, confidence_level=cl)
                print(f"Population mean is between {ci[0]:.2f} and {ci[1]:.2f} with a probablity of {cl}")
                # Population mean is between -0.02 and 0.02 with a probablity of 0.99

    """
    # set random seed for reproducibility
    if seed is not None:
        np.random.seed(seed)
        random.seed(seed)

    data = np.asarray(data)

    if n_iterations < 1:
        raise ValueError(
            f"n_iterations must be a positive integer, but were {n_iterations}"
        )

    n_data = len(data)
    if n_data < 30:
        warn(
            "Dataset size is low, bootstrap estimate might be inaccurate. For accurate results, make sure to provide at least 30 data points."
        )

    if n_sample is None:
        n_sample = n_data
    elif n_sample < 1:
        raise ValueError(f"n_sample must be a positive integer, but was {n_sample}")

    if not (0.0 <= confidence_level <= 1.0):
        raise ValueError(
            f"ci must be a float within [0.0, 1.0], but was {confidence_level}"
        )

    # bootstrap estimates
    theta_b = np.empty(n_iterations, dtype=float)
    for i in range(n_iterations):
        idx = np.random.randint(n_data - 1, size=(n_sample,))
        sample = data[idx]
        theta_b[i] = statistic_fn(sample)
    theta_b = theta_b[~np.isnan(theta_b)]

    match algorithm:
        case "percentile":
            alpha = 1.0 - confidence_level
            alpha /= 2.0
            q = np.asarray([alpha, 1.0 - alpha])
        case "bca":
            # acceleration: estimate a from jackknife bootstrap
            theta_hat = statistic_fn(data)
            jn_idxs = ~np.eye(n_data, dtype=bool)
            theta_jn = np.empty(n_data, dtype=float)
            for i in range(n_data):
                theta_jn[i] = (n_data - 1) * (
                    theta_hat - statistic_fn(data[jn_idxs[i]])
                )
            theta_jn = theta_jn[~np.isnan(theta_jn)]

            a = (np.sum(theta_jn**3) / np.sum(theta_jn**2, axis=-1) ** 1.5) / 6

            alpha = 1.0 - confidence_level
            alpha /= 2
            q = np.asarray([alpha, 1.0 - alpha])

            # bias correction
            N = NormalDistribution()
            ppf = np.vectorize(N.ppf)
            cdf = np.vectorize(N.cdf)

            # bias term. discrepancy between bootrap values and estimated value
            z_0 = ppf(np.mean(theta_b < theta_hat))
            z_u = ppf(q)
            z_diff = z_0 + z_u

            q = cdf(z_0 + (z_diff / (1 - a * z_diff)))
        case _:
            raise ValueError(f"Algorithm '{algorithm}' is not available!")

    # sanity checks
    if np.any(np.isnan(q)):
        warn(
            f"q contains NaN values. Input data is probably invalid. Interval will be (nan, nan). data: {data}"
        )
        ci_low = ci_high = np.nan
    else:
        if np.any((q < 0.0) | (q > 1.0)):
            warn(
                f"q ({q}) out of bounds. Input data is probably invalid. q will be clipped into interval [0.0, 1.0]. data: {data}"
            )
            q = np.clip(q, 0.0, 1.0)
        ci_low, ci_high = np.percentile(theta_b, q * 100)

    return (ci_low, ci_high), theta_b
