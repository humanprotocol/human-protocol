# human_protocol_sdk.agreement.utils module

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
* **Example:**
  ```python
  from human_protocol_sdk.agreement.utils import confusion_matrix
  import numpy as np

  annotations = np.asarray([
      ["a", "a"],
      ["b", "a"],
      ["c", "c"]
  ])

  # infer labels automatically
  cm = confusion_matrix(annotations, return_labels=False)
  print(cm)
  # [[1 0 0]
  #  [1 0 0]
  #  [0 0 1]]
  ```

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
* **Example:**
  ```python
  from human_protocol_sdk.agreement.utils import label_counts

  annotations = [
      ["white", "black", "white"],
      ["white", "white", "white"],
      ["black", "black", "black"],
      ["white",   "nan", "black"],
  ]

  # infer labels automatically
  counts, labels = label_counts(annotations, return_labels=True)
  print(counts)
  # [[1 2]
  #  [0 3]
  #  [3 0]
  #  [1 1]]

  # labels are inferred and sorted automatically
  print(labels)
  # ['black' 'white']
  ```

  ```python
  # labels are provided, label order is preserved
  counts, labels = label_counts(
      annotations,
      labels=['white', 'black'],
      return_labels=True
  )
  print(counts)
  # [[2 1]
  #  [3 0]
  #  [0 3]
  #  [1 1]]

  print(labels)
  # ['white' 'black']
  ```

  ```python
  # can be achieved using nan values
  counts, labels = label_counts(
      annotations,
      nan_values=[''],
      return_labels=True
  )

  print(counts)
  # [[1 2]
  #  [0 3]
  #  [3 0]
  #  [1 1]]

  print(labels)
  # ['black' 'white']
  ```

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
* **Example:**
  ```python
  from human_protocol_sdk.agreement.utils import records_from_annotations
  import numpy as np

  annotations = np.asarray([
      ["cat", "not", "cat"],
      ["cat", "cat", "cat"],
      ["not", "not", "not"],
      ["cat", np.nan, "not"],
  ])

  # nan values are automatically filtered
  values, items, annotators = records_from_annotations(annotations)
  print(values)
  # ['cat' 'not' 'cat' 'cat' 'cat' 'cat' 'not' 'not' 'not' 'cat' 'not']
  print(items)
  # [0 0 0 1 1 1 2 2 2 3 3]
  print(annotators)
  # [0 1 2 0 1 2 0 1 2 0 2]
  ```

  ```python
  annotators = np.asarray(["bob", "alice", "charlie"])
  items = np.asarray(["item_1", "item_2", "item_3", "item_4"])

  values, items, annotators = records_from_annotations(
      annotations,
      annotators,
      items
  )
  print(values)
  # ['cat' 'not' 'cat' 'cat' 'cat' 'cat' 'not' 'not' 'not' 'cat' 'not']
  print(items)
  # ['item_1' 'item_1' 'item_1' 'item_2' 'item_2' 'item_2' 'item_3' 'item_3' 'item_3' 'item_4' 'item_4']
  print(annotators)
  # ['bob' 'alice' 'charlie' 'bob' 'alice' 'charlie' 'bob' 'alice' 'charlie' 'bob' 'charlie']
  ```
