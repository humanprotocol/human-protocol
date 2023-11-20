# human_protocol_sdk.agreement package

## Submodules

## human_protocol_sdk.agreement.bootstrap module

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

## human_protocol_sdk.agreement.measures module

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

## human_protocol_sdk.agreement.utils module

Module containing helper functions for calculating agreement measures.

### *class* human_protocol_sdk.agreement.utils.NormalDistribution(location=0.0, scale=1.0)

Bases: `object`

Continuous Normal Distribution.

See: [https://en.wikipedia.org/wiki/Normal_distribution](https://en.wikipedia.org/wiki/Normal_distribution)

#### \_\_init_\_(location=0.0, scale=1.0)

Creates a NormalDistribution from the given parameters.

* **Parameters:**
  * **location** (`float`) – Location of the distribution.
  * **scale** (`float`) – Scale of the distribution. Must be positive.

#### cdf(x)

Cumulative Distribution Function of the Normal Distribution. Returns
the probability that a random sample will be less than the given
point.

* **Parameters:**
  **x** (`float`) – Point within the distribution’s domain.
* **Return type:**
  `float`

#### pdf(x)

Probability Density Function of the Normal Distribution. Returns the
probability for observing the given sample in the distribution.

* **Parameters:**
  **x** (`float`) – Point within the distribution’s domain.
* **Return type:**
  `float`

#### ppf(p)

Probability Point function of the Normal Distribution. Returns
the maximum point to which cumulated probabilities equal the given
probability. Also called quantile. Inverse of the cdf.

* **Parameters:**
  **p** (`float`) – Percentile of the distribution to be covered by the ppf.
* **Return type:**
  `float`

### human_protocol_sdk.agreement.utils.confusion_matrix(annotations, labels=None, return_labels=False)

Generate an N X N confusion matrix from the given sequence of values a and b,
where N is the number of unique labels.

* **Parameters:**
  * **annotations** (`ndarray`) – Annotation data to be converted into confusion matrix.
    Must be a N x 2 Matrix, where N is the number of items and 2 is the number of annotators.
  * **labels** (`Optional`[`Sequence`]) – Sequence of labels to be counted.
    Entries not found in the list are omitted.
    No labels are provided, the list of labels is inferred from the given annotations.
  * **return_labels** – Whether to return labels with the counts.
* **Returns:**
  A confusion matrix.
  Rows represent labels assigned by b, columns represent labels assigned by a.

### human_protocol_sdk.agreement.utils.label_counts(annotations, labels=None, return_labels=False)

Converts the given sequence of item annotations to an array of label counts per item.

* **Parameters:**
  * **annotations** (`Sequence`) – A two-dimensional sequence. Rows represent items, columns represent annotators.
  * **labels** – List of labels to be counted. Entries not found in the list are omitted. If
    omitted, all labels in the annotations are counted.
  * **nan_values** – Values in the records to be counted as invalid.
  * **return_labels** – Whether to return labels with the counts. Automatically set to true if labels are
    inferred.
* **Returns:**
  A two-dimensional array of integers. Rows represent items, columns represent labels.

### human_protocol_sdk.agreement.utils.observed_and_expected_differences(annotations, distance_function)

Returns observed and expected differences for given annotations (item-value
pairs), as used in Krippendorff’s alpha agreement measure and the Sigma
agreement measure.

* **Parameters:**
  * **annotations** – Annotation data.
    Must be a N x M Matrix, where N is the number of items and M is the number of annotators.
  * **distance_function** – Function to calculate distance between two values.
    Calling distance_fn(annotations[i, j], annotations[p, q]) must return a number.
    Can also be one of ‘nominal’, ‘ordinal’, ‘interval’ or ‘ratio’ for
    default functions pertaining to the level of measurement of the data.
* **Returns:**
  A tuple consisting of numpy ndarrays,
  containing the observed and expected differences in annotations.

### human_protocol_sdk.agreement.utils.records_from_annotations(annotations, annotators=None, items=None, labels=None)

Turns given annotations into sequences of records.

* **Parameters:**
  * **annotations** (`ndarray`) – Annotation matrix (2d array) to convert. Columns represent
  * **annotators** – List of annotator ids. Must be the same length as columns in annotations.
  * **items** – List of item ids. Must be the same length as rows in annotations.
  * **labels** – The to be included in the matrix.
* **Return type:**
  `Tuple`[`ndarray`, `ndarray`, `ndarray`]
* **Returns:**
  Tuple containing arrays of item value ids, item ids and annotator ids

## Module contents
