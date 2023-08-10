from functools import partial
from itertools import pairwise

import numpy as np

from src.constants import JobTypes
from src.modules.agreement import cohens_kappa, fleiss_kappa
from src.modules.agreement.utils import confusion_matrix_from_sequence
import pandas as pd

from typing import Sequence, Mapping, TypeVar, Optional

T = TypeVar("T")
S = TypeVar("S")


def _id_map(a: Sequence[T]) -> dict[int, T]:
    return {i: x for i, x in enumerate(np.unique(a))}


def _reverse_map(d: Mapping[T, S]) -> Mapping[S, T]:
    return {v: k for k, v in d.items()}


def _calculate_kappa_from_series(
    series_a: pd.Series, series_b: pd.Series, labels: Sequence = None
):
    df = pd.concat([series_a, series_b], join="inner", axis=1)
    a = df.iloc[:, 0]
    b = df.iloc[:, 1]
    return cohens_kappa(confusion_matrix_from_sequence(a, b, labels=labels))


def process_image_label_binary_intermediate_results(
    intermediate_results: list[dict],
) -> dict:
    # turn into record format
    records = []
    for unit in intermediate_results:
        url = unit["url"]
        for answer in unit["answers"]:
            records.append(
                {"url": url, "assignee": answer["assignee"], "tag": answer["tag"]}
            )
    records = pd.DataFrame.from_records(records)

    # calculate final dataset by majority vote
    tags = np.unique(records["tag"])
    id_to_tag = _id_map(tags)
    tag_counts = (
        records.groupby("url")["tag"]
        .value_counts()
        .unstack("tag")
        .fillna(0)
        .astype(int)
    )
    dataset = (
        tag_counts.apply(np.argmax, axis=1).map(id_to_tag).rename("tag").to_frame()
    )

    # assign majority answer information to records
    records.set_index(["url", "assignee"], inplace=True)
    records["matches_majority"] = records["tag"].eq(dataset["tag"]).astype(int)

    # assign voting ratios to dataset
    records.reset_index(inplace=True)
    dataset[["total_answers", "majority_answers"]] = records.groupby("url").agg(
        total_anwers=("tag", "count"), majority_answers=("matches_majority", "count")
    )
    records.set_index("url", inplace=True)

    # calculate statistics for assignees
    calc_majority_kappa = partial(
        _calculate_kappa_from_series, series_b=dataset["tag"], labels=tags
    )
    assignee_statistics = records.groupby("assignee").agg(
        majority_answers=("matches_majority", np.sum),
        total_answers=("tag", "count"),
        kappa_with_majority=("tag", calc_majority_kappa),
    )
    assignee_statistics["minority_answers"] = (
        assignee_statistics["total_answers"] - assignee_statistics["majority_answers"]
    )

    # calculate pairwise agreements
    assignees = np.unique(records["assignee"])
    pairwise_kappas = []
    for assignee_a, assignee_b in pairwise(assignees):
        series_a = records["tag"].query(f"assignee == {assignee_a}")
        series_b = records["tag"].query(f"assignee == {assignee_b}")
        pairwise_kappas.append(
            {
                "assignee_a": assignee_a,
                "assignee_b": assignee_b,
                "kappa": _calculate_kappa_from_series(series_a, series_b, tags),
                "count": len(series_a),
            }
        )
    pairwise_kappas = pd.DataFrame.from_records(pairwise_kappas)

    # encode data and add mappings
    tag_to_id = _reverse_map(id_to_tag)
    id_to_assignee = _id_map(assignees)
    assignee_to_id = _reverse_map(id_to_assignee)
    urls = np.unique(records.index)
    id_to_url = _id_map(urls)
    url_to_id = _reverse_map(id_to_url)

    mapping_dict = {
        "tag": tag_to_id,
        "assignee": assignee_to_id,
        "url": url_to_id,
        "assignee_a": assignee_to_id,
        "assignee_b": assignee_to_id,
    }

    # encode all datasets
    dataset = dataset.reset_index().replace(mapping_dict)
    tag_counts = tag_counts.reset_index().replace(mapping_dict)
    assignee_statistics = assignee_statistics.reset_index().replace(mapping_dict)
    records = records.reset_index().replace(mapping_dict)
    pairwise_kappas.replace(mapping_dict)

    # prepare response
    final_results = {
        "encodings": {
            "tag": list(tags),
            "assignee": list(assignees),
            "url": list(urls),
        },
        "dataset": {
            "agreement": {"fleiss_kappa": fleiss_kappa(tag_counts)},
            "data": dataset.to_dict(orient="list"),
            "tag_counts": tag_counts.to_dict(orient="list"),
        },
        "assignee_information": {
            "pairwise_agreement": pairwise_kappas,
            "annotation_match_statistics": assignee_statistics.to_dict(orient="list"),
        },
        "raw_records": records.to_dict(orient="list"),
    }

    return final_results


def process_intermediate_results(
    intermediate_results: list[dict], job_type: str
) -> dict:
    match job_type:
        case JobTypes.image_label_binary.value:
            final_results = process_image_label_binary_intermediate_results(
                intermediate_results
            )

    return final_results
