import numpy as np
from typing import Sequence, Callable, Optional
from pyerf import erf, erfinv
from warnings import warn


class NormalDistribution:
    """Continuous Normal Distribution.

    See: https://en.wikipedia.org/wiki/Normal_distribution
    """

    def __init__(self, location: float = 0.0, scale: float = 1.0):
        """Creates a NormalDistribution from the given parameters.
        Args:
            location: Location of the distribution.
            scale: Scale of the distribution. Must be positive.
        """
        if scale < 0.0:
            raise ValueError(f"scale parameter needs to be positive, but was {scale}")

        self.location = location
        self.scale = scale

    def cdf(self, x: float) -> float:
        """Cumulative Distribution Function of the Normal Distribution. Returns
        the probability that a random sample will be less than the given
        point.

        Args:
            x: Point within the distribution's domain.
        """
        return (1 + erf((x - self.location) / (self.scale * 2**0.5))) / 2

    def pdf(self, x: float) -> float:
        """Probability Density Function of the Normal Distribution. Returns the
        probability for observing the given sample in the distribution.

        Args:
            x: Point within the distribution's domain.
        """
        return np.exp(-0.5 * (x - self.location / self.scale) ** 2) / (
            self.scale * (2 * np.pi) ** 0.5
        )

    def ppf(self, p: float) -> float:
        """Probability Point function of the Normal Distribution. Returns
        the maximum point to which cumulated probabilities equal the given
        probability. Also called quantile. Inverse of the cdf.

        Args:
              p: Percentile of the distribution to be covered by the ppf.
        """
        if not (0.0 <= p <= 1.0):
            raise ValueError(f"p must be a float within [0.0, 1.0], but was {p}")

        return self.location + self.scale * 2**0.5 * erfinv(2 * p - 1.0)


def bootstrap_ci(
    data: Sequence,
    statistic_fn: Callable,
    n_iterations: int = 1000,
    n_sample: Optional[int] = None,
    ci=0.95,
    algorithm="bca",
) -> tuple:
    """Returns the confidence interval for the boostrap estimate of the given
    statistic.

    Args:
        data: Data to estimate the statistic.
        statistic_fn: Function to calculate the statistic. `f(data)` must
            return the statistic.
        n_iterations: Number of bootstrap samples to use for the estimate.
        n_sample: If provided, determines the size of each bootstrap sample
            drawn from the data. If omitted, is equal to the length of the
            data.
        ci: Size of the confidence interval.
        algorithm: Which algorithm to use for the confidence interval
            estimation. "bca" uses the "Bias Corrected Bootstrap with
            Acceleration", "percentile" simply takes the appropriate
            percentiles from the bootstrap distribution.
    """
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

    if not (0.0 <= ci <= 1.0):
        raise ValueError(f"ci must be a float within [0.0, 1.0], but was {ci}")

    # bootstrap estimates
    theta_b = np.empty(n_iterations, dtype=float)
    for i in range(n_iterations):
        idx = np.random.randint(n_data - 1, size=(n_sample,))
        sample = data[idx]
        theta_b[i] = statistic_fn(sample)

    match algorithm:
        case "percentile":
            alpha = 1.0 - ci
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

            a = (np.sum(theta_jn**3) / np.sum(theta_jn**2, axis=-1) ** 1.5) / 6

            alpha = 1.0 - ci
            alpha /= 2
            q = np.asarray([alpha, 1.0 - alpha])

            # bias correction
            N = NormalDistribution()
            ppf = np.vectorize(N.ppf)
            cdf = np.vectorize(N.cdf)

            z_0 = ppf(np.mean(theta_b <= theta_hat))
            z_u = ppf(q)
            z_diff = z_0 + z_u

            q = cdf(z_0 + (z_diff / (1 - a * z_diff)))
        case _:
            raise ValueError(f"Algorithm '{algorithm}' is not available!")

    ci_low, ci_high = np.percentile(theta_b, q * 100)

    return (ci_low, ci_high), theta_b
