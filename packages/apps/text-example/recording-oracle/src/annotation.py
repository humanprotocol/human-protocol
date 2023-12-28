from collections import Counter
from statistics import mean

from pygamma_agreement import Continuum
from pyannote.core import Segment
from pygamma_agreement import CombinedCategoricalDissimilarity


def calculate_intermediate_results(annotations: list[dict]):
    # todo: incorporate ground truth information
    # todo: calculate annotator scores (fallback if gt is not available?)

    # group data by task
    grouped_by_task = {}
    for annotation in annotations:
        task = annotation["task_key"]

        if task not in grouped_by_task:
            grouped_by_task[task] = []

        grouped_by_task.get(task).append(annotation)

    gammas = []
    gammas_ci_low = []
    gammas_ci_high = []
    all_annotations = []

    alpha = 0.05
    for task in grouped_by_task:
        # create continuum
        task_annos = grouped_by_task[task]
        try:
            continuum = Continuum()
            for annotation in task_annos:
                annotator = annotation["annotator_id"]
                label = annotation["value"]["label"]
                span = annotation["value"]["span"]
                continuum.add(annotator, Segment(*span), label)

            # compute gamma
            dissimilarity = CombinedCategoricalDissimilarity()
            results = continuum.compute_gamma(
                dissimilarity, precision_level=alpha, fast=True
            )
            gamma = results.gamma
            ci_low, ci_high = results.approx_gamma_range
            gammas.append(gamma)
            gammas_ci_low.append(ci_low)
            gammas_ci_high.append(ci_high)

            # consolidate annotations
            consolidated_annotations = []
            for alignment in results.best_alignment:
                label_counts = Counter(
                    [
                        unit.annotation
                        for annotator, unit in alignment.n_tuple
                        if unit is not None
                    ]
                )
                best_label, n_votes = label_counts.most_common(1)[0]
                annotation = {
                    "task_key": task,
                    "annotation": {
                        "span": list(alignment.bounds),
                        "label": best_label,
                    },
                    "confidence": n_votes / alignment.nb_units,
                    "label_dist": dict(label_counts),
                }
                consolidated_annotations.append(annotation)
        except AssertionError:  # either only a single annotation available or all annotations by the same annotator for this task. gamma is not defined.
            consolidated_annotations = []
            for task_anno in task_annos:
                annotation = {
                    "task_key": task,
                    "annotation": task_anno["value"],
                    "confidence": 1.0,
                    "label_dist": {task_anno["value"]["label"]: 1},
                }
                consolidated_annotations.append(annotation)

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

    return intermediate_results
