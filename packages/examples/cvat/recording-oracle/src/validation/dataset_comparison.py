import itertools
from typing import Any, Callable, Dict, Tuple

import datumaro as dm
import numpy as np
from attrs import define, field

from .annotation_matching import Bbox, Point, bbox_iou, match_annotations, point_to_bbox_cmp


class CachedSimilarityFunction:
    def __call__(self, gt_ann: Any, ds_ann: Any) -> float:
        key = (
            id(gt_ann),
            id(ds_ann),
        )  # make sure the boxes have stable ids before calling this!
        cached_value = self._memo.get(key)

        if cached_value is None:
            cached_value = self._inner(gt_ann, ds_ann)
            self._memo[key] = cached_value

        return cached_value

    def clear_cache(self):
        self._memo.clear()

    def __init__(self, inner: Callable) -> None:
        self._memo: Dict[Tuple[int, int], float] = {}
        self._inner = inner


@define
class DatasetComparator:
    min_similarity_threshold: float

    def compare(self, gt_dataset: dm.Dataset, ds_dataset: dm.Dataset) -> float:
        ...


class BboxDatasetComparator(DatasetComparator):
    def compare(self, gt_dataset: dm.Dataset, ds_dataset: dm.Dataset) -> float:
        similarity_fn = CachedSimilarityFunction(bbox_iou)

        all_similarities = []

        for ds_sample in ds_dataset:
            gt_sample = gt_dataset.get(ds_sample.id)

            if not gt_sample:
                continue

            ds_boxes = [
                Bbox(a.x, a.y, a.w, a.h, a.label)
                for a in ds_sample.annotations
                if isinstance(a, dm.Bbox)
            ]
            gt_boxes = [
                Bbox(a.x, a.y, a.w, a.h, a.label)
                for a in gt_sample.annotations
                if isinstance(a, dm.Bbox)
            ]

            matching_result = match_annotations(
                gt_boxes,
                ds_boxes,
                similarity=similarity_fn,
                min_similarity=self.min_similarity_threshold,
            )

            for gt_bbox, ds_bbox in itertools.chain(
                matching_result.matches,
                matching_result.mispred,
                zip(matching_result.a_extra, itertools.repeat(None)),
                zip(itertools.repeat(None), matching_result.b_extra),
            ):
                sim = similarity_fn(gt_bbox, ds_bbox) if gt_bbox and ds_bbox else 0
                all_similarities.append(sim)

        return np.mean(all_similarities) if all_similarities else 0


class PointsDatasetComparator(DatasetComparator):
    def compare(self, gt_dataset: dm.Dataset, ds_dataset: dm.Dataset) -> float:
        similarity_fn = CachedSimilarityFunction(point_to_bbox_cmp)

        all_similarities = []

        for ds_sample in ds_dataset:
            gt_sample = gt_dataset.get(ds_sample.id)

            if not gt_sample:
                continue

            ds_points = [
                Point(
                    a.elements[0].points[0],
                    a.elements[0].points[1],
                    a.elements[0].label,
                )
                for a in ds_sample.annotations
                if isinstance(a, dm.Skeleton)
            ]
            gt_boxes = [
                Bbox(a.x, a.y, a.w, a.h, a.label)
                for a in gt_sample.annotations
                if isinstance(a, dm.Bbox)
            ]

            matching_result = match_annotations(
                gt_boxes,
                ds_points,
                similarity=similarity_fn,
                min_similarity=self.min_similarity_threshold,
            )

            for gt_bbox, ds_point in itertools.chain(
                matching_result.matches,
                matching_result.mispred,
                zip(matching_result.a_extra, itertools.repeat(None)),
                zip(itertools.repeat(None), matching_result.b_extra),
            ):
                sim = similarity_fn(gt_bbox, ds_point) if gt_bbox and ds_point else 0
                all_similarities.append(sim)

        return np.mean(all_similarities) if all_similarities else 0
