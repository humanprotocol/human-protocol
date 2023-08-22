import numpy as np
from typing import Sequence, Callable, Optional
from pyerf import erf, erfinv


class NormalDistribution:
    def __init__(self, location: float = 0.0, scale: float = 1.0):
        if scale < 0.0:
            raise ValueError(f"scale parameter needs to be positive, but was {scale}")

        self.location = location
        self.scale = scale

    def cdf(self, x: float):
        return (1 + erf((x - self.location) / (self.scale * 2**0.5))) / 2

    def pdf(self, x: float):
        return np.exp(-0.5 * (x - self.location / self.scale) ** 2) / (
            self.scale * (2 * np.pi) ** 0.5
        )

    def ppf(self, p: float):
        return self.location + self.scale * 2**0.5 * erfinv(2 * p - 1.0)


def bootstrap_ci(
    data: Sequence,
    statistic_fn: Callable,
    n_iterations: int = 1000,
    n_sample: Optional[int] = None,
    ci=0.95,
    algorithm="bca",
) -> tuple:
    data = np.asarray(data)

    n_data = len(data)

    if n_sample is None:
        n_sample = n_data

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

            a_hat = (np.sum(theta_jn**3) / np.sum(theta_jn**2, axis=-1) ** 1.5) / 6
            print(a_hat)

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

            q = cdf(z_0 + (z_diff / (1 - a_hat * z_diff)))
            print(q)
        case _:
            raise ValueError(f"Algorithm '{algorithm}' is not available!")

    ci_low, ci_high = np.percentile(theta_b, q * 100)

    return (ci_low, ci_high), theta_b
