# human_protocol_sdk.agreement.bootstrap module

Module containing methods to calculate confidence intervals using bootstrapping.

### human_protocol_sdk.agreement.bootstrap.confidence_intervals(data, statistic_fn, n_iterations=1000, n_sample=None, confidence_level=0.95, algorithm='bca', seed=None)

Returns a tuple, containing the confidence interval for the boostrap estimates of the given statistic and statistics of the bootstrap samples.

* **Parameters:**
  * **data** (`Sequence`) – Data to estimate the statistic.
  * **statistic_fn** (`Callable`) – Function to calculate the statistic. statistic_fn(data) must return a number.
  * **n_iterations** (`int`) – Number of bootstrap samples to use for the estimate.
  * **n_sample** (`Optional`[`int`]) – If provided, determines the size of each bootstrap sample
    drawn from the data. If omitted, is equal to the length of the data.
  * **confidence_level** – Size of the confidence interval.
  * **algorithm** – Which algorithm to use for the confidence interval
    estimation. “bca” uses the “Bias Corrected Bootstrap with
    Acceleration”, “percentile” simply takes the appropriate
    percentiles from the bootstrap distribution.
  * **seed** – Random seed to use.
* **Return type:**
  `Tuple`[`Tuple`[`float`, `float`], `ndarray`]
* **Returns:**
  Confidence interval and bootstrap distribution.
* **Example:**
  ```python
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
  ```
