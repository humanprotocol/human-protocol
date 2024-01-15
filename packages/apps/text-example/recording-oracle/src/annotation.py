from collections import Counter
from enum import Enum
from statistics import mean

import pandas as pd
import numpy as np
from pygamma_agreement import Continuum
from pyannote.core import Segment
from pygamma_agreement import CombinedCategoricalDissimilarity
from sortedcontainers import SortedSet


class Fields(str, Enum):
    ANNOTATOR_ID = "annotator_id"
    ANNOTATION_ID = "annotation_id"
    DATAPOINT_URI = "datapoint_uri"
    TASK_KEY = "task_key"
    VALUE = "value"


GT_ANNOTATOR = "ground_truth"


def calculate_gamma_results(
    data_frame: pd.DataFrame, alpha: float = 0.05, gt_annotator=None
):
    if gt_annotator is not None:
        gt_annotator = SortedSet([gt_annotator])

    # create continuum
    continuum = Continuum()
    for _, annotation in data_frame.iterrows():
        annotator = annotation["annotator_id"]
        label = annotation["value"]["label"]
        span = annotation["value"]["span"]
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


def group_by(values, key):
    grouped = {}
    for entry in values:
        group_value = entry[key]

        if group_value not in grouped:
            grouped[group_value] = []

        grouped.get(group_value).append(entry)
    return grouped


def calculate_intermediate_results(annotations: list[dict], ground_truth: dict = None):
    # annotation as data frame
    annotations = pd.DataFrame(data=annotations).drop(columns=Fields.ANNOTATION_ID)

    if ground_truth is not None:
        # ground truth as data frame
        gt_entries = []
        for datapoint_uri, values in ground_truth.items():
            for value in values:
                entry = {
                    Fields.DATAPOINT_URI.value: datapoint_uri,
                    Fields.VALUE.value: value,
                    Fields.ANNOTATOR_ID.value: GT_ANNOTATOR,
                }
                gt_entries.append(entry)
        gt = pd.DataFrame(gt_entries)

        is_gt = annotations[Fields.DATAPOINT_URI.value].isin(
            gt[Fields.DATAPOINT_URI.value]
        )

        task_annos = annotations[~is_gt]
        gt_annos = annotations[is_gt]
    else:
        task_annos = annotations.copy()
        gt_annos = None

    # reliability analysis
    uris = []
    gammas = []
    gammas_ci_low = []
    gammas_ci_high = []
    all_annotations = []

    alpha = 0.05
    for uri, uri_df in task_annos.groupby(Fields.DATAPOINT_URI):
        task_key = uri_df[Fields.TASK_KEY.value].dropna().values[0]

        try:
            # compute gamma
            results = calculate_gamma_results(uri_df, alpha=alpha)

            ci_low, ci_high = results.approx_gamma_range
            gammas.append(results.gamma)
            gammas_ci_low.append(ci_low)
            gammas_ci_high.append(ci_high)

            # consolidate annotations
            consolidated_annotations = consolidate_annotations(
                results.best_alignment, task_key=task_key, datapoint_uri=uri
            )

        # gamma computation failed, as all annotations by the same annotator for this document.
        # all annotations are added, as consolidation is not needed.
        except AssertionError:
            # gamma is not defined
            gammas.append(np.NAN)
            gammas_ci_low.append(np.NAN)
            gammas_ci_high.append(np.NAN)
            consolidated_annotations = []
            for _, annotation in uri_df.iterrows():
                anno = {
                    "task_key": annotation["task_key"],
                    "datapoint_uri": annotation["datapoint_uri"],
                    "annotation": annotation["value"],
                    "confidence": 1.0,
                    "label_dist": {annotation["value"]["label"]: 1},
                }
                consolidated_annotations.append(anno)

        uris.append(uri)
        all_annotations.extend(consolidated_annotations)

    # compose intermediate results
    intermediate_results = {
        "annotations": all_annotations,
        "agreement": {
            "task_set": {
                "measure": "gamma",
                "score": mean(gammas),
                "confidence_interval": [mean(gammas_ci_low), mean(gammas_ci_high)],
                "confidence_level": 1 - alpha,
            }
        },
    }

    # calculate reliability on ground truth set
    annotator_results = {}
    if gt_annos is None:
        gt = (
            pd.DataFrame(data=all_annotations)
            .drop(columns=["label_dist", "confidence"])
            .rename(columns={"annotation": "value"})
        )
        gt[Fields.ANNOTATOR_ID.value] = GT_ANNOTATOR
        gt_annos = task_annos.copy()

    for annotator, annotator_df in gt_annos.groupby("annotator_id"):
        uris = annotator_df["datapoint_uri"]
        gt_df = pd.concat([annotator_df, gt.query(f"datapoint_uri in @uris")])
        gammas = []
        for uri, uri_df in gt_df.groupby("datapoint_uri"):
            results = calculate_gamma_results(uri_df, alpha=None)
            gamma = results.gamma
            gammas.append(gamma)
        annotator_results[annotator] = mean(gammas)

    intermediate_results["agreement"]["annotators"] = annotator_results

    return intermediate_results
