import numpy as np
from typing import Sequence, Callable, Optional


def bootstrap_ci(
    data: Sequence,
    statistic_fn: Callable,
    n_iterations: int = 1000,
    n_sample: Optional[int] = None,
    ci=0.95,
    algorithm="percentile",
) -> tuple:
    data = np.asarray(data)

    n_data = len(data)

    if n_sample is None:
        n_sample = n_data

    # bootstrap estimates
    theta_b = []
    for i in range(n_iterations):
        idx = np.random.randint(n_data - 1, size=(n_sample,))
        sample = data[idx]
        theta_b.append(statistic_fn(sample))

    theta_b = np.asarray(theta_b)

    match algorithm:
        case "percentile":
            alpha = 1.0 - ci
            alpha /= 2.0
            q = np.asarray([alpha, 1.0 - alpha])
        case _:
            raise ValueError(f"Algorithm '{algorithm}' is not available!")

    ci_low, ci_high = np.percentile(theta_b, q * 100)

    return (ci_low, ci_high), theta_b
