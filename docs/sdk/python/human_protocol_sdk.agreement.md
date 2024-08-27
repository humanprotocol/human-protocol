# human_protocol_sdk.agreement package

**A subpackage for calculating Inter Rater Agreement measures for annotated data.**

This module contains methods that estimate the agreement
between annotatorsin a data labelling project.
Its role is to provide easy access to means of estimating data quality
for developers of Reputation and Recording Oracles.

## Getting Started

This module is an optional extra of the HUMAN Protocol SDK.
In order to use it, run the following command:

```bash
pip install human_protocol_sdk[agreement]
```

### A simple example

The main functionality of the module is provided by a single function called [agreement](human_protocol_sdk.agreement.measures.md#human_protocol_sdk.agreement.measures.agreement).
Suppose we have a very small annotation, where 3 annotators label 4 different images.
The goal is to find find if an image contain a cat or not,
so they label them either cat or not.

After processing, the data might look look like that:

```python
from numpy import nan
annotations = [
    ['cat', 'not', 'cat'],
    ['cat', 'cat', 'cat'],
    ['not', 'not', 'not'],
    ['cat',   nan, 'not'],
]
```

Each row contains the annotations for a single item and
each column contains the annotations of an individual annotator.
We call this format ‘annotation’ format,
which is the default format expected by the agreement function
and all measures implemented in this package.

Our data contains a missing value, indicated by the nan entry.
Annotator 2 did not provide an annotation for item 4.
All missing values must be marked in this way.

So, we can simply plug our annotations into the function.

```python
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
#                        ['cat', 'nan', 'not']], dtype='<U3'),
#         'bootstrap_method': None,
#         'bootstrap_kwargs': None,
#         'measure_kwargs': {}
#     }
# }
```

We receive an agreement report.
It is simply a dictionary, containing two keys: ‘results’ and ‘config’.
The results dictionary contain the actual scores,
while config contains the exact set of parameters that produced this output.

Given that Fleiss’ Kappa is ranging from -1 to 1,
this is an acceptable yet suboptimal score.

For more information on the capabilities of this module and its functionalities,
read the [agreement function page](human_protocol_sdk.agreement.measures.md#human_protocol_sdk.agreement.measures.agreement).

## Submodules

* [human_protocol_sdk.agreement.bootstrap module](human_protocol_sdk.agreement.bootstrap.md)
  * [`confidence_intervals()`](human_protocol_sdk.agreement.bootstrap.md#human_protocol_sdk.agreement.bootstrap.confidence_intervals)
* [human_protocol_sdk.agreement.measures module](human_protocol_sdk.agreement.measures.md)
  * [`agreement()`](human_protocol_sdk.agreement.measures.md#human_protocol_sdk.agreement.measures.agreement)
  * [`cohens_kappa()`](human_protocol_sdk.agreement.measures.md#human_protocol_sdk.agreement.measures.cohens_kappa)
  * [`fleiss_kappa()`](human_protocol_sdk.agreement.measures.md#human_protocol_sdk.agreement.measures.fleiss_kappa)
  * [`krippendorffs_alpha()`](human_protocol_sdk.agreement.measures.md#human_protocol_sdk.agreement.measures.krippendorffs_alpha)
  * [`percentage()`](human_protocol_sdk.agreement.measures.md#human_protocol_sdk.agreement.measures.percentage)
  * [`sigma()`](human_protocol_sdk.agreement.measures.md#human_protocol_sdk.agreement.measures.sigma)
* [human_protocol_sdk.agreement.utils module](human_protocol_sdk.agreement.utils.md)
  * [`NormalDistribution`](human_protocol_sdk.agreement.utils.md#human_protocol_sdk.agreement.utils.NormalDistribution)
    * [`NormalDistribution.__init__()`](human_protocol_sdk.agreement.utils.md#human_protocol_sdk.agreement.utils.NormalDistribution.__init__)
    * [`NormalDistribution.cdf()`](human_protocol_sdk.agreement.utils.md#human_protocol_sdk.agreement.utils.NormalDistribution.cdf)
    * [`NormalDistribution.pdf()`](human_protocol_sdk.agreement.utils.md#human_protocol_sdk.agreement.utils.NormalDistribution.pdf)
    * [`NormalDistribution.ppf()`](human_protocol_sdk.agreement.utils.md#human_protocol_sdk.agreement.utils.NormalDistribution.ppf)
  * [`confusion_matrix()`](human_protocol_sdk.agreement.utils.md#human_protocol_sdk.agreement.utils.confusion_matrix)
  * [`label_counts()`](human_protocol_sdk.agreement.utils.md#human_protocol_sdk.agreement.utils.label_counts)
  * [`observed_and_expected_differences()`](human_protocol_sdk.agreement.utils.md#human_protocol_sdk.agreement.utils.observed_and_expected_differences)
  * [`records_from_annotations()`](human_protocol_sdk.agreement.utils.md#human_protocol_sdk.agreement.utils.records_from_annotations)
