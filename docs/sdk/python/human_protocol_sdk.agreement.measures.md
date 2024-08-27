# human_protocol_sdk.agreement.measures module

Module containing Inter Rater Agreement Measures.

### human_protocol_sdk.agreement.measures.agreement(annotations, measure='krippendorffs_alpha', labels=None, bootstrap_method=None, bootstrap_kwargs=None, measure_kwargs=None)

Calculates agreement across the given data using the given method.

* **Parameters:**
  * **annotations** (`Sequence`) – Annotation data.
    Must be a N x M Matrix, where N is the number of annotated items and
    M is the number of annotators. Missing values must be indicated by nan.
  * **measure** – Specifies the method to use.
    Must be one of ‘cohens_kappa’, ‘percentage’, ‘fleiss_kappa’,
    ‘sigma’ or ‘krippendorffs_alpha’.
  * **labels** (`Optional`[`Sequence`]) – List of labels to use for the annotation.
    If set to None, labels are inferred from the data.
    If provided, values not in the labels are set to nan.
  * **bootstrap_method** (`Optional`[`str`]) – Name of the bootstrap method to use
    for calculating confidence intervals.
    If set to None, no confidence intervals are calculated.
    If provided, must be one of ‘percentile’ or ‘bca’.
  * **bootstrap_kwargs** (`Optional`[`dict`]) – Dictionary of keyword arguments to be passed
    to the bootstrap function.
  * **measure_kwargs** (`Optional`[`dict`]) – Dictionary of keyword arguments to be
    passed to the measure function.
* **Return type:**
  `dict`
* **Returns:**
  A dictionary containing the keys “results” and “config”.
  Results contains the scores, while config contains parameters
  that produced the results.
* **Example:**
  ```python
  from human_protocol_sdk.agreement import agreement

  annotations = [
      ['cat', 'not', 'cat'],
      ['cat', 'cat', 'cat'],
      ['not', 'not', 'not'],
      ['cat', 'nan', 'not'],
  ]

  agreement_report = agreement(annotations, measure="fleiss_kappa")
  print(agreement_report)
  # {
  #     'results': {
  #         'measure': 'fleiss_kappa',
  #         'score': 0.3950000000000001,
  #         'ci': None,
  #         'confidence_level': None
  #     },
  #     'config': {
  #         'measure': 'fleiss_kappa',
  #         'labels': array(['cat', 'not'], dtype='<U3'),
  #         'data': array([['cat', 'not', 'cat'],
  #                        ['cat', 'cat', 'cat'],
  #                        ['not', 'not', 'not'],
  #                        ['cat', '', 'not']], dtype='<U3'),
  #         'bootstrap_method': None,
  #         'bootstrap_kwargs': {},
  #         'measure_kwargs': {}
  #     }
  # }
  ```

### human_protocol_sdk.agreement.measures.cohens_kappa(annotations)

Returns Cohen’s Kappa for the provided annotations.

* **Parameters:**
  **annotations** (`ndarray`) – Annotation data.
  Must be a N x M Matrix, where N is the number of annotated items and M
  is the number of annotators. Missing values must be indicated by nan.
* **Return type:**
  `float`
* **Returns:**
  Value between -1.0 and 1.0,
  indicating the degree of agreement between both raters.
* **Example:**
  ```python
  from human_protocol_sdk.agreement.measures import cohens_kappa
  import numpy as np

  annotations = np.asarray([
          ["cat", "cat"],
          ["cat", "cat"],
          ["not", "cat"],
          ["not", "cat"],
          ["cat", "not"],
          ["not", "not"],
          ["not", "not"],
          ["not", "not"],
          ["not", "not"],
          ["not", "not"],
  ])
  print(cohens_kappa(annotations))
  # 0.348
  ```

### human_protocol_sdk.agreement.measures.fleiss_kappa(annotations)

Returns Fleisss’ Kappa for the provided annotations.

* **Parameters:**
  **annotations** (`ndarray`) – Annotation data.
  Must be a N x M Matrix, where N is the number of items and
  M is the number of annotators.
* **Return type:**
  `float`
* **Returns:**
  Value between -1.0 and 1.0,
  indicating the degree of agreement between all raters.
* **Example:**
  ```python
  from human_protocol_sdk.agreement.measures import fleiss_kappa
  import numpy as np

  # 3 raters, 2 classes
  annotations = np.asarray([
      ["cat", "not", "cat"],
      ["cat", "cat", "cat"],
      ["not", "not", "not"],
      ["cat", "cat", "not"],
  ])
  print(f"{fleiss_kappa(annotations):.3f}")
  # 0.395
  ```

### human_protocol_sdk.agreement.measures.krippendorffs_alpha(annotations, distance_function)

Calculates Krippendorff’s Alpha for the given annotations (item-value pairs),
using the given distance function.

* **Parameters:**
  * **annotations** (`ndarray`) – Annotation data.
    Must be a N x M Matrix, where N is the number of annotated items and
    M is the number of annotators. Missing values must be indicated by nan.
  * **distance_function** (`Union`[`Callable`, `str`]) – Function to calculate distance between two values.
    Calling distance_fn(annotations[i, j], annotations[p, q]) must return a number.
    Can also be one of ‘nominal’, ‘ordinal’, ‘interval’ or ‘ratio’ for
    default functions pertaining to the level of measurement of the data.
* **Return type:**
  `float`
* **Returns:**
  Value between -1.0 and 1.0,
  indicating the degree of agreement.
* **Example:**
  ```python
  from human_protocol_sdk.agreement.measures import krippendorffs_alpha
  import numpy as np

  annotations = np.asarray([
      [0, 0, 0],
      [0, 1, 1]]
  )
  print(krippendorffs_alpha(annotations, distance_function="nominal"))
  # 0.375
  ```

### human_protocol_sdk.agreement.measures.percentage(annotations)

Returns the overall agreement percentage observed across the data.

* **Parameters:**
  **annotations** (`ndarray`) – Annotation data.
  Must be a N x M Matrix, where N is the number of annotated items and
  M is the number of annotators. Missing values must be indicated by nan.
* **Return type:**
  `float`
* **Returns:**
  Value between 0.0 and 1.0, indicating the percentage of agreement.
* **Example:**
  ```python
  from human_protocol_sdk.agreement.measures import percentage
  import numpy as np

  annotations = np.asarray([
      ["cat", "not", "cat"],
      ["cat", "cat", "cat"],
      ["not", "not", "not"],
      ["cat", "cat", "not"],
  ])
  print(percentage(annotations))
  # 0.7
  ```

### human_protocol_sdk.agreement.measures.sigma(annotations, distance_function, p=0.05)

Calculates the Sigma Agreement Measure for the given annotations (item-value pairs),
using the given distance function.
For details, see [https://dl.acm.org/doi/fullHtml/10.1145/3485447.3512242](https://dl.acm.org/doi/fullHtml/10.1145/3485447.3512242).

* **Parameters:**
  * **annotations** (`ndarray`) – Annotation data.
    Must be a N x M Matrix, where N is the number of annotated items and
    M is the number of annotators. Missing values must be indicated by nan.
  * **distance_function** (`Union`[`Callable`, `str`]) – Function to calculate distance between two values.
    Calling distance_fn(annotations[i, j], annotations[p, q]) must return a number.
    Can also be one of ‘nominal’, ‘ordinal’, ‘interval’ or ‘ratio’ for
    default functions pertaining to the level of measurement of the data.
  * **p** – Probability threshold between 0.0 and 1.0
    determining statistical significant difference. The lower, the stricter.
* **Return type:**
  `float`
* **Returns:**
  Value between 0.0 and 1.0, indicating the degree of agreement.
* **Example:**
  ```python
  from human_protocol_sdk.agreement.measures import sigma
  import numpy as np

  np.random.seed(42)
  n_items = 500
  n_annotators = 5

  # create annotations
  annotations = np.random.rand(n_items, n_annotators)
  means = np.random.rand(n_items, 1) * 100
  scales = np.random.randn(n_items, 1) * 10
  annotations = annotations * scales + means
  d = "interval"

  print(sigma(annotations, d))
  # 0.6538
  ```
