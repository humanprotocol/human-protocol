from collections import Counter
from functools import partial
import numpy as np

from src.schemas.agreement import (
    ImageLabelBinaryFinalResult,
    ResultDataset,
    WorkerPerformanceResult,
    ImageLabelBinaryJobResults,
)
from src.core.constants import JobTypes
from src.agreement import cohens_kappa, fleiss_kappa, percent_agreement
from src.utils import confusion_matrix_from_sequence
import pandas as pd

from typing import Sequence, Mapping, TypeVar

T = TypeVar("T")
S = TypeVar("S")


def _id_map(a: Sequence[T]) -> dict[int, T]:
    return {i: x for i, x in enumerate(np.unique(a))}


def _reverse_map(d: Mapping[T, S]) -> Mapping[S, T]:
    return {v: k for k, v in d.items()}


def _calculate_kappa_from_series(
    series_a: pd.Series, series_b: pd.Series, labels: Sequence = None
):
    # get only intersecting annotations
    df = pd.concat([series_a, series_b], join="inner", axis=1)

    # disjoint sets of annotations
    if len(df) == 0:
        return np.NaN

    a = df.iloc[:, 0]
    b = df.iloc[:, 1]
    return cohens_kappa(confusion_matrix_from_sequence(a, b, labels=labels))


def process_image_label_binary_intermediate_results(
    intermediate_results: list[dict],
) -> ImageLabelBinaryJobResults:
    # turn into record format
    records = []
    for item in intermediate_results:
        url = item["url"]
        for answer in item["answers"]:
            records.append(
                {"url": url, "assignee": answer["assignee"], "tag": answer["tag"]}
            )
    records = pd.DataFrame.from_records(records)

    # calculate final dataset by majority vote
    tags = np.unique(records["tag"])
    id_to_tag = _id_map(tags)
    by_url_tag = records.groupby("url")["tag"]
    tag_counts = by_url_tag.value_counts().unstack("tag").fillna(0).astype(int)

    ###
    # Calculate Dataset
    ##
    dataset = (
        tag_counts.apply(np.argmax, axis=1).map(id_to_tag).rename("label").to_frame()
    )

    dataset["label_counts"] = (
        records.groupby(["url"])["tag"]
        .value_counts()
        .unstack()
        .fillna(0)
        .to_dict(orient="records")
    )

    # calculate percentage of votes for consensus label
    def calc_label_score(label_counts):
        c = Counter(label_counts)
        count = c.most_common(1)[0][1]
        return count / c.total()

    dataset["score"] = dataset["label_counts"].map(calc_label_score)

    # calculate dataset wide statistics
    dataset_scores = {
        "fleiss_kappa": {
            "score": fleiss_kappa(tag_counts),
            "interval": None,
            "alpha": None,
        },
        "avg_percent_agreement_across_labels": {
            "score": percent_agreement(tag_counts),
            "interval": None,
            "alpha": None,
        },
    }

    ###
    # Calculate Worker Performance Result
    ###

    # assign majority answer information to records
    records.set_index(["url", "assignee"], inplace=True)
    records["matches_majority"] = records["tag"].eq(dataset["label"]).astype(int)

    # calculate statistics for assignees
    calc_majority_kappa = partial(
        _calculate_kappa_from_series, series_b=dataset["label"], labels=tags
    )

    assignee_statistics = (
        records.reset_index()
        .set_index("url")
        .groupby(["assignee"])
        .agg(
            consensus_annotations=("matches_majority", np.sum),
            total_annotations=("tag", "count"),
            score=("tag", calc_majority_kappa),
        )
        .reset_index()
        .rename(columns={"assignee": "worker_id"})
    )

    # prepare response
    result_dataset = ResultDataset(
        dataset_scores=dataset_scores,
        data_points=[
            ImageLabelBinaryFinalResult(**data_point)
            for data_point in dataset.reset_index().to_dict(orient="records")
        ],
    )

    worker_performance = [
        WorkerPerformanceResult(**result)
        for result in assignee_statistics.to_dict(orient="records")
    ]

    results = ImageLabelBinaryJobResults(
        dataset=result_dataset, worker_performance=worker_performance
    )

    return results


def process_intermediate_results(intermediate_results: list[dict], job_type: str):
    match job_type:
        case JobTypes.image_label_binary.value:
            return process_image_label_binary_intermediate_results(
                intermediate_results
            ).dict()
        case _:
            raise ValueError(f'job_type "{job_type}" did not match any valid job type.')
