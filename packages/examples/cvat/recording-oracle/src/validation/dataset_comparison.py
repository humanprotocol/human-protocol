import itertools
from abc import ABCMeta, abstractmethod
from typing import Any, Callable, Dict, Optional, Sequence, Tuple

import datumaro as dm
import numpy as np
from attrs import define

from .annotation_matching import (
    Bbox,
    MatchResult,
    Point,
    bbox_iou,
    match_annotations,
    point_to_bbox_cmp,
)


class CachedSimilarityFunction:
    def __init__(
        self, sim_fn: Callable, *, cache: Optional[Dict[Tuple[int, int], float]] = None
    ) -> None:
        self.cache: Dict[Tuple[int, int], float] = cache or {}
        self.sim_fn = sim_fn

    def __call__(self, gt_ann: Any, ds_ann: Any) -> float:
        key = (
            id(gt_ann),
            id(ds_ann),
        )  # make sure the annotations have stable ids before calling this
        cached_value = self.cache.get(key)

        if cached_value is None:
            cached_value = self.sim_fn(gt_ann, ds_ann)
            self.cache[key] = cached_value

        return cached_value

    def clear_cache(self):
        self.cache.clear()


@define
class DatasetComparator(metaclass=ABCMeta):
    min_similarity_threshold: float

    @abstractmethod
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


class SkeletonDatasetComparator(DatasetComparator):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self._skeleton_info: Dict[int, list[str]] = {}
        self.categories: Optional[dm.CategoriesInfo] = None

        # TODO: find better strategy for sigma estimation
        self.oks_sigma = 0.1  # average value for COCO points

    def compare(self, gt_dataset: dm.Dataset, ds_dataset: dm.Dataset) -> float:
        self.categories = gt_dataset.categories()

        all_similarities = []
        total_anns_to_compare = 0

        for ds_sample in ds_dataset:
            gt_sample = gt_dataset.get(ds_sample.id)

            if not gt_sample:
                continue

            matching_result, similarity_fn = self.match_skeletons(gt_sample, ds_sample)

            for gt_skeleton, ds_skeleton in itertools.chain(
                matching_result.matches,
                matching_result.mispred,
                zip(matching_result.a_extra, itertools.repeat(None)),
                zip(itertools.repeat(None), matching_result.b_extra),
            ):
                sim = similarity_fn(gt_skeleton, ds_skeleton) if gt_skeleton and ds_skeleton else 0
                all_similarities.append(sim)

                total_anns_to_compare += (gt_skeleton is not None) + (ds_skeleton is not None)

        accuracy = 0
        if total_anns_to_compare:
            accuracy = 2 * np.sum(all_similarities) / total_anns_to_compare

        return accuracy

    def _get_skeleton_info(self, skeleton_label_id: int):
        label_cat: dm.LabelCategories = self.categories[dm.AnnotationType.label]
        skeleton_info = self._skeleton_info.get(skeleton_label_id)

        if skeleton_info is None:
            skeleton_label_name = label_cat[skeleton_label_id].name

            # Build a sorted list of sublabels to arrange skeleton points during comparison
            skeleton_info = sorted(
                idx for idx, label in enumerate(label_cat) if label.parent == skeleton_label_name
            )
            self._skeleton_info[skeleton_label_id] = skeleton_info

        return skeleton_info

    def match_skeletons(self, item_a, item_b):
        a_skeletons = [a for a in item_a.annotations if isinstance(a, dm.Skeleton)]
        b_skeletons = [a for a in item_b.annotations if isinstance(a, dm.Skeleton)]

        # Convert skeletons to point lists for comparison
        # This is required to compute correct per-instance distance
        # It is assumed that labels are the same in the datasets
        skeleton_infos = {}
        points_map = {}
        skeleton_map = {}
        a_points = []
        b_points = []
        for source, source_points in [(a_skeletons, a_points), (b_skeletons, b_points)]:
            for skeleton in source:
                skeleton_info = skeleton_infos.setdefault(
                    skeleton.label, self._get_skeleton_info(skeleton.label)
                )

                # Merge skeleton points into a single list
                # The list is ordered by skeleton_info
                skeleton_points = [
                    next((p for p in skeleton.elements if p.label == sublabel), None)
                    for sublabel in skeleton_info
                ]

                # Build a single Points object for further comparisons
                merged_points = dm.Points()
                merged_points.points = np.ravel(
                    [p.points if p else [0, 0] for p in skeleton_points]
                )
                merged_points.visibility = np.ravel(
                    [p.visibility if p else [dm.Points.Visibility.absent] for p in skeleton_points]
                )
                merged_points.label = skeleton.label
                # no per-point attributes currently in CVAT

                points_map[id(merged_points)] = skeleton
                skeleton_map[id(skeleton)] = merged_points
                source_points.append(merged_points)

        instance_map = {}
        for source in [item_a.annotations, item_b.annotations]:
            for instance_group in dm.ops.find_instances(source):
                instance_bbox = self._instance_bbox(instance_group)

                instance_group = [
                    skeleton_map[id(a)] if isinstance(a, dm.Skeleton) else a
                    for a in instance_group
                    if not isinstance(a, dm.Skeleton) or skeleton_map[id(a)] is not None
                ]
                for ann in instance_group:
                    instance_map[id(ann)] = [instance_group, instance_bbox]

        keypoints_matcher = self._KeypointsMatcher(instance_map=instance_map, sigma=self.oks_sigma)
        keypoints_similarity = CachedSimilarityFunction(keypoints_matcher.distance)
        matching_result = match_annotations(
            a_points,
            b_points,
            similarity=keypoints_similarity,
            min_similarity=self.min_similarity_threshold,
        )

        distances = keypoints_similarity.cache

        matched, mismatched, a_extra, b_extra = matching_result

        matched = [(points_map[id(p_a)], points_map[id(p_b)]) for (p_a, p_b) in matched]
        mismatched = [(points_map[id(p_a)], points_map[id(p_b)]) for (p_a, p_b) in mismatched]
        a_extra = [points_map[id(p_a)] for p_a in a_extra]
        b_extra = [points_map[id(p_b)] for p_b in b_extra]

        # Map points back to skeletons
        for p_a_id, p_b_id in list(distances.keys()):
            dist = distances.pop((p_a_id, p_b_id))
            distances[(id(points_map[p_a_id]), id(points_map[p_b_id]))] = dist

        similarity_fn = CachedSimilarityFunction(None)
        similarity_fn.cache.update(distances)

        return MatchResult(matched, mismatched, a_extra, b_extra), similarity_fn

    def _instance_bbox(
        self, instance_anns: Sequence[dm.Annotation]
    ) -> Tuple[float, float, float, float]:
        return dm.ops.max_bbox(
            a.get_bbox() if isinstance(a, dm.Skeleton) else a
            for a in instance_anns
            if hasattr(a, "get_bbox") and not a.attributes.get("outside", False)
        )

    @define(kw_only=True)
    class _KeypointsMatcher(dm.ops.PointsMatcher):
        def distance(self, a: dm.Points, b: dm.Points) -> float:
            a_bbox = self.instance_map[id(a)][1]
            b_bbox = self.instance_map[id(b)][1]
            if dm.ops.bbox_iou(a_bbox, b_bbox) <= 0:
                return 0

            bbox = dm.ops.mean_bbox([a_bbox, b_bbox])
            return self._OKS(
                a,
                b,
                sigma=self.sigma,
                bbox=bbox,
                visibility_a=[v == dm.Points.Visibility.visible for v in a.visibility],
                visibility_b=[v == dm.Points.Visibility.visible for v in b.visibility],
            )

        @classmethod
        def _OKS(
            cls, a, b, sigma=0.1, bbox=None, scale=None, visibility_a=None, visibility_b=None
        ) -> float:
            """
            Object Keypoint Similarity metric.
            https://cocodataset.org/#keypoints-eval
            """

            p1 = np.array(a.points).reshape((-1, 2))
            p2 = np.array(b.points).reshape((-1, 2))
            if len(p1) != len(p2):
                return 0

            if visibility_a is None:
                visibility_a = np.full(len(p1), True)
            else:
                visibility_a = np.asarray(visibility_a, dtype=bool)

            if visibility_b is None:
                visibility_b = np.full(len(p2), True)
            else:
                visibility_b = np.asarray(visibility_b, dtype=bool)

            if not scale:
                if bbox is None:
                    bbox = dm.ops.mean_bbox([a, b])
                scale = bbox[2] * bbox[3]

            total_vis = np.sum(visibility_a | visibility_b, dtype=float)
            if not total_vis:
                return 1.0

            dists = np.linalg.norm(p1 - p2, axis=1)
            return (
                np.sum(
                    visibility_a
                    * visibility_b
                    * np.exp(-(dists**2) / (2 * scale * ((2 * sigma) ** 2)))
                )
                / total_vis
            )
