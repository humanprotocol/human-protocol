from __future__ import annotations

import itertools
from abc import ABCMeta, abstractmethod
from typing import Callable, Dict, Optional, Sequence, Set, Tuple, Union

import datumaro as dm
import numpy as np
from attrs import define, field
from datumaro.util.annotation_util import BboxCoords

from src.core.config import Config
from src.core.validation_errors import TooFewGtError

from .annotation_matching import (
    Bbox,
    MatchResult,
    Point,
    bbox_iou,
    match_annotations,
    point_to_bbox_cmp,
)


class SimilarityFunction(metaclass=ABCMeta):
    "A function to compute similarity between 2 annotations"

    def __call__(self, gt_ann: dm.Annotation, ds_ann: dm.Annotation) -> float:
        ...


class CachedSimilarityFunction(SimilarityFunction):
    def __init__(
        self, sim_fn: Callable, *, cache: Optional[Dict[Tuple[int, int], float]] = None
    ) -> None:
        self.cache: Dict[Tuple[int, int], float] = cache or {}
        self.sim_fn = sim_fn

    def __call__(self, gt_ann: dm.Annotation, ds_ann: dm.Annotation) -> float:
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
    _min_similarity_threshold: float
    _gt_weights: Dict[str, float] = field(factory=dict)

    failed_gts: Set[str] = field(factory=set, init=False)
    "Recorded list of failed GT samples, available after compare() call"

    def compare(self, gt_dataset: dm.Dataset, ds_dataset: dm.Dataset) -> float:
        dataset_similarities = []
        dataset_total_anns_to_compare = 0
        dataset_failed_gts = set()
        dataset_excluded_gts_count = 0

        for ds_sample in ds_dataset:
            gt_sample = gt_dataset.get(ds_sample.id)

            if not gt_sample:
                continue

            sample_weight = self._gt_weights.get(gt_sample.id, 1)
            if not sample_weight:
                dataset_excluded_gts_count += 1
                continue

            sample_similarity_threshold = self._min_similarity_threshold * sample_weight
            matching_result, similarity_fn = self.compare_sample_annotations(
                gt_sample, ds_sample, similarity_threshold=sample_similarity_threshold
            )

            sample_similarities = []
            sample_total_anns_to_compare = 0
            for gt_ann, ds_ann in itertools.chain(
                matching_result.matches,
                matching_result.mispred,
                zip(matching_result.a_extra, itertools.repeat(None)),
                zip(itertools.repeat(None), matching_result.b_extra),
            ):
                sim = similarity_fn(gt_ann, ds_ann) if gt_ann and ds_ann else 0
                sample_similarities.append(sim)
                sample_total_anns_to_compare += (gt_ann is not None) + (ds_ann is not None)

            dataset_similarities.extend(sample_similarities)
            dataset_total_anns_to_compare += sample_total_anns_to_compare

            sample_accuracy = 0
            if sample_total_anns_to_compare:
                sample_accuracy = 2 * np.sum(sample_similarities) / sample_total_anns_to_compare

            if sample_accuracy < sample_similarity_threshold:
                dataset_failed_gts.add(gt_sample.id)

        if dataset_excluded_gts_count == len(gt_dataset):
            raise TooFewGtError()

        dataset_accuracy = 0
        if dataset_total_anns_to_compare:
            dataset_accuracy = 2 * np.sum(dataset_similarities) / dataset_total_anns_to_compare

        self.failed_gts = dataset_failed_gts

        return dataset_accuracy

    @abstractmethod
    def compare_sample_annotations(
        self, gt_sample: dm.DatasetItem, ds_sample: dm.DatasetItem, *, similarity_threshold: float
    ) -> Tuple[MatchResult, SimilarityFunction]:
        ...


class BboxDatasetComparator(DatasetComparator):
    def compare_sample_annotations(
        self, gt_sample: dm.DatasetItem, ds_sample: dm.DatasetItem, *, similarity_threshold: float
    ) -> Tuple[MatchResult, SimilarityFunction]:
        similarity_fn = CachedSimilarityFunction(bbox_iou)

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
            min_similarity=similarity_threshold,
        )

        return matching_result, similarity_fn


class PointsDatasetComparator(DatasetComparator):
    def compare_sample_annotations(
        self, gt_sample: dm.DatasetItem, ds_sample: dm.DatasetItem, *, similarity_threshold: float
    ) -> Tuple[MatchResult, SimilarityFunction]:
        similarity_fn = CachedSimilarityFunction(point_to_bbox_cmp)

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
            min_similarity=similarity_threshold,
        )

        return matching_result, similarity_fn


_SkeletonInfo = list[str]


@define
class SkeletonDatasetComparator(DatasetComparator):
    _skeleton_info: Dict[int, _SkeletonInfo] = field(factory=dict, init=False)
    _categories: Optional[dm.CategoriesInfo] = field(default=None, init=False)

    # TODO: find better strategy for sigma estimation
    _oks_sigma: float = Config.validation.default_oks_sigma

    def compare(self, gt_dataset: dm.Dataset, ds_dataset: dm.Dataset) -> float:
        self._categories = gt_dataset.categories()
        return super().compare(gt_dataset, ds_dataset)

    def compare_sample_annotations(
        self, gt_sample: dm.DatasetItem, ds_sample: dm.DatasetItem, *, similarity_threshold: float
    ) -> Tuple[MatchResult, SimilarityFunction]:
        return self._match_skeletons(
            gt_sample, ds_sample, similarity_threshold=similarity_threshold
        )

    def _get_skeleton_info(self, skeleton_label_id: int) -> _SkeletonInfo:
        label_cat: dm.LabelCategories = self._categories[dm.AnnotationType.label]
        skeleton_info = self._skeleton_info.get(skeleton_label_id)

        if skeleton_info is None:
            skeleton_label_name = label_cat[skeleton_label_id].name

            # Build a sorted list of sublabels to arrange skeleton points during comparison
            skeleton_info = sorted(
                idx for idx, label in enumerate(label_cat) if label.parent == skeleton_label_name
            )
            self._skeleton_info[skeleton_label_id] = skeleton_info

        return skeleton_info

    def _match_skeletons(
        self, item_a: dm.DatasetItem, item_b: dm.DatasetItem, *, similarity_threshold: float
    ) -> Tuple[MatchResult, SimilarityFunction]:
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

        keypoints_matcher = self._KeypointsMatcher(instance_map=instance_map, sigma=self._oks_sigma)
        keypoints_similarity = CachedSimilarityFunction(keypoints_matcher.distance)
        matching_result = match_annotations(
            a_points,
            b_points,
            similarity=keypoints_similarity,
            min_similarity=similarity_threshold,
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
            return self._compute_oks(
                a,
                b,
                sigma=self.sigma,
                bbox=bbox,
                # Our current annotation approach
                # doesn't allow to distinguish between 'occluded' and 'absent' points
                visibility_a=[v == dm.Points.Visibility.visible for v in a.visibility],
                visibility_b=[v == dm.Points.Visibility.visible for v in b.visibility],
            )

        @classmethod
        def _compute_oks(
            cls,
            a: dm.Points,
            b: dm.Points,
            *,
            sigma: Union[float, np.ndarray] = 0.1,
            bbox: Optional[BboxCoords] = None,
            scale: Union[None, float, np.ndarray] = None,
            visibility_a: Union[None, bool, Sequence[bool]] = None,
            visibility_b: Union[None, bool, Sequence[bool]] = None,
        ) -> float:
            """
            Computes Object Keypoint Similarity metric for a pair of point sets.
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
                # We treat this situation as match. It's possible to use alternative approaches,
                # such as add weight for occluded points.
                return 1.0

            dists = np.linalg.norm(p1 - p2, axis=1)
            return (
                np.sum(
                    (visibility_a == visibility_b)
                    * np.exp(
                        (visibility_a * visibility_b)
                        * -(dists**2)
                        / (2 * scale * ((2 * sigma) ** 2))
                    )
                )
                / total_vis
            )
