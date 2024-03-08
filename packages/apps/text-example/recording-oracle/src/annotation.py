from collections import Counter

import pandas as pd
import numpy as np
from pygamma_agreement import Continuum
from pyannote.core import Segment
from pygamma_agreement import CombinedCategoricalDissimilarity
from sortedcontainers import SortedSet


class Fields(str):
    ANNOTATOR_ID = "annotator_id"
    ANNOTATION_ID = "annotation_id"
    DATAPOINT_URI = "datapoint_uri"
    TASK_KEY = "task_key"
    VALUE = "value"


GT_ANNOTATOR = "ground_truth"


def calculate_gamma_results(
    data_frame: pd.DataFrame, alpha: float = 0.05, gt_annotator=None
):
    """Computes gamma from the given dataframe. The dataframe must contain all
        annotations that refer to the same document.

    Args:
          data_frame: A dataframe, containing the fields ANNOTATOR_ID and VALUE, where value represents the annotation, containing the "label" and "span" fields.
          alpha: A float between 0 and 1, determining the width of the confidence interval. Lower values produce a wider confidence interval. If set to `None`, no confidence intervals are calculated, speeding up the calculation.
          gt_annotator: An optional list of ground truth annotators to use for dissimilarity sampling. Must contain more than one annotator.
    """
    if gt_annotator is not None:
        gt_annotator = SortedSet(gt_annotator)

    # create continuum
    continuum = Continuum()
    for _, annotation in data_frame.iterrows():
        annotator = annotation[Fields.ANNOTATOR_ID]
        label = annotation[Fields.VALUE]["label"]
        span = annotation[Fields.VALUE]["span"]
        continuum.add(annotator, Segment(*span), label)

    # compute gamma
    dissimilarity = CombinedCategoricalDissimilarity()
    return continuum.compute_gamma(
        dissimilarity,
        precision_level=alpha,
        fast=True,
        ground_truth_annotators=gt_annotator,
    )


def consolidate_annotations(best_alignment, task_key: str = None, datapoint_uri=None):
    """Finds the best fitting span for the given task key and datapoint uri, based on the gamma algorithm results."""
    consolidated_annotations = []
    for alignment in best_alignment:
        label_counts = Counter(
            [
                unit.annotation
                for annotator, unit in alignment.n_tuple
                if unit is not None
            ]
        )
        best_label, n_votes = label_counts.most_common(1)[0]
        anno = {
            "task_key": task_key,
            "datapoint_uri": datapoint_uri,
            "annotation": {
                "span": list(alignment.bounds),
                "label": best_label,
            },
            "confidence": n_votes / alignment.nb_units,
            "label_dist": dict(label_counts),
        }
        consolidated_annotations.append(anno)
    return consolidated_annotations


def ground_truth_as_dataframe(ground_truth: dict):
    """Converts the ground truth as defined in hmt-basemodels into a dataframe."""
    gt_entries = []
    for datapoint_uri, values in ground_truth.items():
        for value in values:
            entry = {
                Fields.DATAPOINT_URI: datapoint_uri,
                Fields.VALUE: value,
                Fields.ANNOTATOR_ID: GT_ANNOTATOR,
            }
            gt_entries.append(entry)
    return pd.DataFrame(gt_entries)


def calculate_intermediate_results(annotations: list[dict], ground_truth: dict = None):
    # annotation as data frame
    annotations = pd.DataFrame(data=annotations).drop(columns=Fields.ANNOTATION_ID)

    if ground_truth is not None:
        ground_truth = ground_truth_as_dataframe(ground_truth)

        is_gt = annotations[Fields.DATAPOINT_URI].isin(
            ground_truth[Fields.DATAPOINT_URI]
        )

        task_set_annos = annotations[~is_gt]
        ground_truth_set_annos = annotations[is_gt]
    else:
        task_set_annos = annotations.copy()
        ground_truth_set_annos = None

    # reliability analysis
    uris = []
    gammas = []
    confidence_interval_low = []
    confidence_interval_high = []
    best_annotations = []

    alpha = 0.05
    for uri, annotations_for_gt_uri in task_set_annos.groupby(Fields.DATAPOINT_URI):
        task_key = annotations_for_gt_uri[Fields.TASK_KEY].dropna().values[0]

        try:
            # compute gamma
            results = calculate_gamma_results(annotations_for_gt_uri, alpha=alpha)

            ci_low, ci_high = results.approx_gamma_range
            gammas.append(results.gamma)
            confidence_interval_low.append(ci_low)
            confidence_interval_high.append(ci_high)

            # consolidate annotations
            consolidated_annotations = consolidate_annotations(
                results.best_alignment, task_key=task_key, datapoint_uri=uri
            )

        # gamma computation failed, as all annotations by the same annotator for this document.
        except AssertionError:
            # gamma is not defined
            gammas.append(np.NAN)
            confidence_interval_low.append(np.NAN)
            confidence_interval_high.append(np.NAN)

            # all annotations are added, as consolidation is not possible.
            consolidated_annotations = []
            for _, annotation in annotations_for_gt_uri.iterrows():
                anno = {
                    "task_key": annotation[Fields.TASK_KEY],
                    "datapoint_uri": annotation[Fields.DATAPOINT_URI],
                    "annotation": annotation[Fields.VALUE],
                    "confidence": 1.0,
                    "label_dist": {annotation[Fields.VALUE]["label"]: 1},
                }
                consolidated_annotations.append(anno)

        uris.append(uri)
        best_annotations.extend(consolidated_annotations)

    # compose intermediate results
    intermediate_results = {
        "annotations": best_annotations,
        "agreement": {
            "task_set": {
                "measure": "gamma",
                "score": np.mean(gammas),
                "confidence_interval": [
                    np.mean(confidence_interval_low),
                    np.mean(confidence_interval_high),
                ],
                "confidence_level": 1 - alpha,
            }
        },
    }

    ##
    # calculate reliability on ground truth set
    ##
    contributions_per_annotator = (
        annotations.groupby(Fields.ANNOTATOR_ID)[Fields.TASK_KEY].nunique().to_dict()
    )

    # use best annotation on task set if no ground truth is available
    if ground_truth is None:
        ground_truth = (
            pd.DataFrame(data=best_annotations)
            .drop(columns=["label_dist", "confidence"])
            .rename(columns={"annotation": "value"})
        )
        ground_truth[Fields.ANNOTATOR_ID] = GT_ANNOTATOR
        ground_truth_set_annos = task_set_annos.copy()

    annotator_results = {}
    for annotator, annotations_by_annotator in ground_truth_set_annos.groupby(
        Fields.ANNOTATOR_ID
    ):
        uris = annotations_by_annotator[Fields.DATAPOINT_URI]
        annos_and_gt_combined = pd.concat(
            [annotations_by_annotator, ground_truth.query(f"datapoint_uri in @uris")]
        )
        gammas = []
        for uri, annotations_for_gt_uri in annos_and_gt_combined.groupby(
            Fields.DATAPOINT_URI
        ):
            results = calculate_gamma_results(annotations_for_gt_uri, alpha=None)
            gamma = results.gamma
            gammas.append(gamma)
        annotator_results[annotator] = {
            "confidence": np.mean(gammas),
            "contributions": contributions_per_annotator.get(annotator, 0),
        }

    intermediate_results["agreement"]["annotators"] = annotator_results

    return intermediate_results
