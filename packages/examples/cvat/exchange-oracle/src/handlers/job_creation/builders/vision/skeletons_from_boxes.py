from __future__ import annotations

import math
import os
import random
import uuid
from concurrent.futures import Future, ThreadPoolExecutor
from dataclasses import dataclass, field
from itertools import chain, groupby
from math import ceil
from queue import Queue
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING

import cv2
import datumaro as dm
import numpy as np
from datumaro.util import take_by
from datumaro.util.annotation_util import BboxCoords, bbox_iou, find_instances
from datumaro.util.image import decode_image, encode_image

import src.core.tasks.skeletons_from_boxes as skeletons_from_boxes_task
import src.cvat.api_calls as cvat_api
import src.services.cvat as db_service
from src.core.config import Config
from src.core.storage import compose_data_bucket_filename, compose_data_bucket_prefix
from src.core.types import TaskStatuses
from src.db import SessionLocal
from src.models.cvat import Project
from src.services.cloud.utils import BucketAccessInfo
from src.utils.annotations import InstanceSegmentsToBbox, ProjectLabels, is_point_in_bbox
from src.utils.logging import format_sequence
from src.utils.roi_uploader import BufferedRoiImageUploader

if TYPE_CHECKING:
    from collections.abc import Sequence
    from pathlib import Path

    from src.core.manifest.v1 import JobManifest

from src.core.tasks.cvat_formats import DM_GT_DATASET_FORMAT_MAPPING
from src.handlers.job_creation.builders.vision.base import TaskBuilderBase
from src.handlers.job_creation.exceptions import (
    DatasetValidationError,
    ExcludedAnnotationsInfo,
    InvalidCoordinates,
    InvalidImageInfo,
    MismatchingAnnotations,
    TooFewSamples,
)
from src.handlers.job_creation.utils import (
    MaybeUnset,
    filter_image_files,
    make_cvat_cloud_storage_params,
    strip_bucket_prefix,
    unset,
)


@dataclass
class _TaskParams:
    label_id: int
    roi_ids: list[int]
    roi_gt_ids: list[int]


@dataclass
class SkeletonsFromBoxesConfig:
    job_size_mult: int = skeletons_from_boxes_task.DEFAULT_ASSIGNMENT_SIZE_MULTIPLIER
    "Job size multiplier"

    roi_file_ext: str = ".png"  # supposed to be lossless and reasonably compressing
    "File extension for RoI images, with leading dot (.) included"

    roi_size_mult: float = 1.1
    "Additional point ROI size multiplier"

    min_roi_size: tuple[int, int] = field(
        default_factory=lambda: (
            Config.core_config.min_roi_size_w,
            Config.core_config.min_roi_size_h,
        )
    )
    "Minimum absolute ROI size, (w, h)"

    boxes_format: str = "coco_person_keypoints"

    embed_bbox_in_roi_image: bool = True
    "Put a bbox into the extracted skeleton RoI images"

    embed_tile_border: bool = True

    embedded_point_radius: int = 15
    min_embedded_point_radius_percent: float = 0.005
    max_embedded_point_radius_percent: float = 0.01
    embedded_point_color: tuple[int, int, int] = (0, 255, 255)

    roi_embedded_bbox_color: tuple[int, int, int] = (0, 255, 255)  # BGR
    roi_background_color: tuple[int, int, int] = (245, 240, 242)  # BGR - CVAT background color

    min_label_gt_samples: int = 2  # TODO: find good threshold

    max_discarded_threshold: float = 0.5
    """
    The maximum allowed percent of discarded
    GT annotations or samples for successful job launch
    """

    gt_id_attribute: str = "object_id"
    "An additional way to match GT skeletons with input boxes"

    # TODO: consider adding an absolute number of minimum GT RoIs


class SkeletonsFromBoxesTaskBuilder(TaskBuilderBase):
    def __init__(self, manifest: JobManifest, escrow_address: str, chain_id: int) -> None:
        super().__init__(manifest=manifest, escrow_address=escrow_address, chain_id=chain_id)

        self._input_gt_data: MaybeUnset[bytes] = unset
        self._input_boxes_data: MaybeUnset[bytes] = unset

        self._data_filenames: MaybeUnset[Sequence[str]] = unset
        self._input_gt_dataset: MaybeUnset[dm.Dataset] = unset
        self._gt_dataset: MaybeUnset[dm.Dataset] = unset
        self._boxes_dataset: MaybeUnset[dm.Dataset] = unset

        self._skeleton_bbox_mapping: MaybeUnset[skeletons_from_boxes_task.SkeletonBboxMapping] = (
            unset
        )
        self._roi_infos: MaybeUnset[skeletons_from_boxes_task.RoiInfos] = unset
        self._roi_info_by_id: MaybeUnset[dict[int, skeletons_from_boxes_task.RoiInfo]] = unset

        self._gt_points_per_label: MaybeUnset[
            dict[tuple[int, str], Sequence[tuple[int, dm.Points]]]
        ] = unset
        "(skeleton_label_id, point_label_name) to [(skeleton_id, point), ...]"

        self._roi_filenames: MaybeUnset[dict[int, str]] = unset

        self._task_params: MaybeUnset[list[_TaskParams]] = unset

        self._excluded_gt_info: MaybeUnset[ExcludedAnnotationsInfo] = unset
        self._excluded_boxes_info: MaybeUnset[ExcludedAnnotationsInfo] = unset

        self.config = SkeletonsFromBoxesConfig()

    def _download_input_data(self):
        data_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
        gt_bucket = BucketAccessInfo.parse_obj(self.manifest.validation.gt_url)
        boxes_bucket = BucketAccessInfo.parse_obj(self.manifest.data.boxes_url)

        data_storage_client = self._make_cloud_storage_client(data_bucket)
        gt_storage_client = self._make_cloud_storage_client(gt_bucket)
        boxes_storage_client = self._make_cloud_storage_client(boxes_bucket)

        data_filenames = data_storage_client.list_files(prefix=data_bucket.path)
        data_filenames = strip_bucket_prefix(data_filenames, prefix=data_bucket.path)
        self._data_filenames = filter_image_files(data_filenames)

        self._input_gt_data = gt_storage_client.download_file(gt_bucket.path)

        self._input_boxes_data = boxes_storage_client.download_file(boxes_bucket.path)

    def _parse_dataset(self, annotation_file_data: bytes, dataset_format: str) -> dm.Dataset:
        temp_dir = self.exit_stack.enter_context(TemporaryDirectory())

        annotation_filename = os.path.join(temp_dir, "annotations.json")
        with open(annotation_filename, "wb") as f:
            f.write(annotation_file_data)

        return dm.Dataset.import_from(annotation_filename, format=dataset_format)

    def _parse_gt(self):
        assert self._input_gt_data is not unset

        self._input_gt_dataset = self._parse_dataset(
            self._input_gt_data,
            dataset_format=DM_GT_DATASET_FORMAT_MAPPING[self.manifest.annotation.type],
        )

    def _parse_boxes(self):
        assert self._input_boxes_data is not unset

        self._boxes_dataset = self._parse_dataset(
            self._input_boxes_data, dataset_format=self.config.boxes_format
        )

    def _validate_gt_labels(self):
        gt_labels = set(
            (label.name, label.parent)
            for label in self._input_gt_dataset.categories()[dm.AnnotationType.label]
        )

        manifest_labels = set()
        for skeleton_label in self.manifest.annotation.labels:
            manifest_labels.add((skeleton_label.name, ""))
            for node_label in skeleton_label.nodes:
                manifest_labels.add((node_label, skeleton_label.name))

        if manifest_labels - gt_labels:
            raise DatasetValidationError(
                "Could not find GT for labels {}".format(
                    format_sequence(
                        [
                            label_name if not parent_name else f"{parent_name}.{label_name}"
                            for label_name, parent_name in manifest_labels - gt_labels
                        ]
                    ),
                )
            )

        # It should not be an issue that there are some extra GT labels - they should
        # just be skipped.
        if gt_labels - manifest_labels:
            self.logger.info(
                "Skipping unknown GT labels: {}".format(
                    format_sequence(
                        [
                            label_name if not parent_name else f"{parent_name}.{label_name}"
                            for label_name, parent_name in gt_labels - manifest_labels
                        ]
                    )
                )
            )

        # Reorder and filter labels to match the manifest
        self._input_gt_dataset.transform(
            ProjectLabels, dst_labels=[label.name for label in self.manifest.annotation.labels]
        )
        self._input_gt_dataset.init_cache()

    def _validate_gt_filenames(self):
        gt_filenames = set(s.id + s.media.ext for s in self._input_gt_dataset)

        known_data_filenames = set(self._data_filenames)
        matched_gt_filenames = gt_filenames.intersection(known_data_filenames)

        if len(gt_filenames) != len(matched_gt_filenames):
            extra_gt = list(map(os.path.basename, gt_filenames - matched_gt_filenames))

            raise MismatchingAnnotations(
                "Failed to find several validation samples in the dataset files: {}".format(
                    format_sequence(extra_gt)
                )
            )

        if len(gt_filenames) < self._job_val_frames_count:
            raise TooFewSamples(
                f"Too few validation samples provided ({len(gt_filenames)}), "
                f"at least {self._job_val_frames_count} required."
            )

    def _validate_gt_annotations(self):
        def _validate_skeleton(skeleton: dm.Skeleton, *, sample_bbox: dm.Bbox):
            if skeleton.id in visited_ids:
                raise DatasetValidationError(f"repeated annotation id {skeleton.id}")

            for element in skeleton.elements:
                # This is what Datumaro is expected to parse
                assert len(element.points) == 2
                assert len(element.visibility) == 1

                if element.visibility[0] == dm.Points.Visibility.absent:
                    continue

                px, py = element.points[:2]
                if not is_point_in_bbox(int(px), int(py), sample_bbox):
                    raise InvalidCoordinates("skeleton point is outside the image")

        label_cat: dm.LabelCategories = self._input_gt_dataset.categories()[dm.AnnotationType.label]

        excluded_gt_info = ExcludedAnnotationsInfo()
        excluded_samples = set()
        visited_ids = set()
        for gt_sample in self._input_gt_dataset:
            # Could fail on this as well
            img_h, img_w = gt_sample.media_as(dm.Image).size
            sample_bbox = dm.Bbox(0, 0, w=img_w, h=img_h)

            sample_skeletons = [a for a in gt_sample.annotations if isinstance(a, dm.Skeleton)]
            valid_skeletons = []
            for skeleton in sample_skeletons:
                try:
                    _validate_skeleton(skeleton, sample_bbox=sample_bbox)
                except DatasetValidationError as error:
                    excluded_gt_info.add_message(
                        "Sample '{}': GT skeleton #{} ({}) skipped - {}".format(
                            gt_sample.id, skeleton.id, label_cat[skeleton.label].name, error
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    continue

                valid_skeletons.append(skeleton)
                visited_ids.add(skeleton.id)

            excluded_gt_info.excluded_count += len(sample_skeletons) - len(valid_skeletons)
            excluded_gt_info.total_count += len(sample_skeletons)

            if len(valid_skeletons) != len(sample_skeletons):
                if not valid_skeletons:
                    excluded_samples.add((gt_sample.id, gt_sample.subset))
                else:
                    # Skeleton boxes can be in the list as well with the same ids / groups
                    skeleton_ids = set(a.id for a in valid_skeletons) - {0}
                    self._input_gt_dataset.put(
                        gt_sample.wrap(
                            annotations=[a for a in gt_sample.annotations if a.id in skeleton_ids]
                        )
                    )

        for excluded_sample in excluded_samples:
            self._input_gt_dataset.remove(*excluded_sample)

        if excluded_gt_info.excluded_count:
            self.logger.warning(
                "Some GT skeletons were excluded due to the errors found: {}".format(
                    format_sequence([e.message for e in excluded_gt_info.messages], separator="\n")
                )
            )

        if excluded_gt_info.excluded_count > ceil(
            excluded_gt_info.total_count * self.config.max_discarded_threshold
        ):
            raise TooFewSamples(
                "Too many GT skeletons discarded, canceling job creation. Errors: {}".format(
                    format_sequence(
                        [error_info.message for error_info in excluded_gt_info.messages]
                    )
                )
            )

        self._excluded_gt_info = excluded_gt_info

    def _validate_gt(self):
        assert self._data_filenames is not unset
        assert self._input_gt_dataset is not unset

        self._validate_gt_filenames()
        self._validate_gt_labels()
        self._validate_gt_annotations()

    def _validate_boxes_categories(self):
        boxes_dataset_categories = self._boxes_dataset.categories()
        boxes_dataset_label_cat: dm.LabelCategories = boxes_dataset_categories[
            dm.AnnotationType.label
        ]

        boxes_labels = set(label.name for label in boxes_dataset_label_cat if not label.parent)
        manifest_labels = set(label.name for label in self.manifest.annotation.labels)
        if manifest_labels != boxes_labels:
            raise DatasetValidationError("Bbox labels do not match job labels")

        # Reorder labels to match the manifest
        self._boxes_dataset.transform(
            ProjectLabels, dst_labels=[label.name for label in self.manifest.annotation.labels]
        )
        self._boxes_dataset.init_cache()

    def _validate_boxes_filenames(self):
        boxes_filenames = set(sample.id + sample.media.ext for sample in self._boxes_dataset)

        known_data_filenames = set(self._data_filenames)
        matched_boxes_filenames = boxes_filenames.intersection(known_data_filenames)

        if len(matched_boxes_filenames) != len(boxes_filenames):
            extra_bbox_samples = list(
                map(os.path.basename, boxes_filenames - matched_boxes_filenames)
            )

            raise MismatchingAnnotations(
                "Failed to find several samples in the dataset files: {}".format(
                    format_sequence(extra_bbox_samples),
                )
            )

    def _validate_boxes_annotations(self):  # noqa: PLR0912
        # Convert possible polygons and masks into boxes
        self._boxes_dataset.transform(InstanceSegmentsToBbox)
        self._boxes_dataset.init_cache()

        excluded_boxes_info = ExcludedAnnotationsInfo()

        label_cat: dm.LabelCategories = self._boxes_dataset.categories()[dm.AnnotationType.label]

        visited_ids = set()
        for sample in self._boxes_dataset:
            # Could fail on this as well
            image_h, image_w = sample.media_as(dm.Image).size

            valid_instances: list[tuple[dm.Bbox, dm.Points]] = []
            instances = find_instances(
                [a for a in sample.annotations if isinstance(a, dm.Bbox | dm.Skeleton)]
            )
            for instance_anns in instances:
                if len(instance_anns) != 2:
                    excluded_boxes_info.add_message(
                        "Sample '{}': object #{} ({}) skipped - unexpected group size ({})".format(
                            sample.id,
                            instance_anns[0].id,
                            label_cat[instance_anns[0].label].name,
                            len(instance_anns),
                        ),
                        sample_id=sample.id,
                        sample_subset=sample.subset,
                    )
                    continue

                bbox = next((a for a in instance_anns if isinstance(a, dm.Bbox)), None)
                if not bbox:
                    excluded_boxes_info.add_message(
                        "Sample '{}': object #{} ({}) skipped - no matching bbox".format(
                            sample.id, instance_anns[0].id, label_cat[instance_anns[0].label].name
                        ),
                        sample_id=sample.id,
                        sample_subset=sample.subset,
                    )
                    continue

                skeleton = next((a for a in instance_anns if isinstance(a, dm.Skeleton)), None)
                if not skeleton:
                    excluded_boxes_info.add_message(
                        "Sample '{}': object #{} ({}) skipped - no matching skeleton".format(
                            sample.id, instance_anns[0].id, label_cat[instance_anns[0].label].name
                        ),
                        sample_id=sample.id,
                        sample_subset=sample.subset,
                    )
                    continue

                if len(skeleton.elements) != 1 or len(skeleton.elements[0].points) != 2:
                    excluded_boxes_info.add_message(
                        "Sample '{}': object #{} ({}) skipped - invalid skeleton points".format(
                            sample.id, skeleton.id, label_cat[skeleton.label].name
                        ),
                        sample_id=sample.id,
                        sample_subset=sample.subset,
                    )
                    continue

                point = skeleton.elements[0]
                if not is_point_in_bbox(point.points[0], point.points[1], (0, 0, image_w, image_h)):
                    excluded_boxes_info.add_message(
                        "Sample '{}': object #{} ({}) skipped - invalid point coordinates".format(
                            sample.id, skeleton.id, label_cat[skeleton.label].name
                        ),
                        sample_id=sample.id,
                        sample_subset=sample.subset,
                    )
                    continue

                if not is_point_in_bbox(int(bbox.x), int(bbox.y), (0, 0, image_w, image_h)):
                    excluded_boxes_info.add_message(
                        "Sample '{}': object #{} ({}) skipped - invalid bbox coordinates".format(
                            sample.id, bbox.id, label_cat[bbox.label].name
                        ),
                        sample_id=sample.id,
                        sample_subset=sample.subset,
                    )
                    continue

                if not is_point_in_bbox(point.points[0], point.points[1], bbox):
                    excluded_boxes_info.add_message(
                        "Sample '{}': object #{} ({}) skipped - point is outside the bbox".format(
                            sample.id, skeleton.id, label_cat[skeleton.label].name
                        ),
                        sample_id=sample.id,
                        sample_subset=sample.subset,
                    )
                    continue

                if bbox.id in visited_ids:
                    excluded_boxes_info.add_message(
                        "Sample '{}': bbox #{} ({}) skipped - repeated annotation id {}".format(
                            sample.id, bbox.id, label_cat[bbox.label].name, bbox.id
                        ),
                        sample_id=sample.id,
                        sample_subset=sample.subset,
                    )
                    continue

                valid_instances.append(
                    (bbox, point.wrap(group=bbox.group, id=bbox.id, attributes=bbox.attributes))
                )
                visited_ids.add(bbox.id)

            excluded_boxes_info.excluded_count += len(instances) - len(valid_instances)
            excluded_boxes_info.total_count += len(instances)

            if len(valid_instances) != len(sample.annotations):
                self._boxes_dataset.put(
                    sample.wrap(annotations=list(chain.from_iterable(valid_instances)))
                )

        if excluded_boxes_info.excluded_count > ceil(
            excluded_boxes_info.total_count * self.config.max_discarded_threshold
        ):
            raise TooFewSamples(
                "Too many boxes discarded, canceling job creation. Errors: {}".format(
                    format_sequence(
                        [error_info.message for error_info in excluded_boxes_info.messages]
                    )
                )
            )

        excluded_samples = set((e.sample_id, e.sample_subset) for e in excluded_boxes_info.messages)
        for excluded_sample in excluded_samples:
            self._boxes_dataset.remove(*excluded_sample)

        if excluded_samples:
            self.logger.warning(
                "Some boxes were excluded due to the errors found: {}".format(
                    format_sequence(
                        [e.message for e in excluded_boxes_info.messages], separator="\n"
                    )
                )
            )

        self._excluded_boxes_info = excluded_boxes_info

    def _validate_boxes(self):
        assert self._data_filenames is not unset
        assert self._boxes_dataset is not unset

        self._validate_boxes_categories()
        self._validate_boxes_filenames()
        self._validate_boxes_annotations()

    def _match_boxes(self, a: BboxCoords, b: BboxCoords) -> bool:
        return bbox_iou(a, b) > 0

    def _get_skeleton_bbox(
        self, skeleton: dm.Skeleton, annotations: Sequence[dm.Annotation]
    ) -> BboxCoords:
        matching_bbox = None
        if skeleton.group:
            matching_bbox = next(
                (
                    bbox
                    for bbox in annotations
                    if isinstance(bbox, dm.Bbox) and bbox.group == skeleton.group
                ),
                None,
            )

        if matching_bbox:
            bbox = matching_bbox.get_bbox()
        else:
            bbox = skeleton.get_bbox()

            if any(
                v != dm.Points.Visibility.absent for e in skeleton.elements for v in e.visibility
            ):
                # If there's only 1 visible point, the bbox will have 0 w and h
                bbox = [bbox[0], bbox[1], max(1, bbox[2]), max(1, bbox[3])]

        return bbox

    def _prepare_gt(self):
        def _find_unambiguous_matches(
            input_boxes: list[dm.Bbox],
            gt_skeletons: list[dm.Skeleton],
            *,
            input_points: list[dm.Points],
            gt_annotations: list[dm.Annotation],
        ) -> list[tuple[dm.Bbox, dm.Skeleton]]:
            bbox_point_mapping: dict[int, dm.Points] = {
                bbox.id: next(p for p in input_points if p.group == bbox.group)
                for bbox in input_boxes
            }

            matches = [
                [
                    (input_bbox.label == gt_skeleton.label)
                    and (
                        self._match_boxes(
                            input_bbox.get_bbox(),
                            self._get_skeleton_bbox(gt_skeleton, gt_annotations),
                        )
                    )
                    and (input_point := bbox_point_mapping[input_bbox.id])
                    and is_point_in_bbox(
                        input_point.points[0],
                        input_point.points[1],
                        self._get_skeleton_bbox(gt_skeleton, gt_annotations),
                    )
                    and (
                        # a way to customize matching if the default method is too rough
                        not (bbox_id := input_bbox.attributes.get(self.config.gt_id_attribute))
                        or not (
                            skeleton_id := gt_skeleton.attributes.get(self.config.gt_id_attribute)
                        )
                        or bbox_id == skeleton_id
                    )
                    for gt_skeleton in gt_skeletons
                ]
                for input_bbox in input_boxes
            ]

            ambiguous_boxes: list[int] = set()
            ambiguous_skeletons: list[int] = set()
            for bbox_idx, input_bbox in enumerate(input_boxes):
                matched_skeletons: list[dm.Skeleton] = [
                    gt_skeletons[j] for j in range(len(gt_skeletons)) if matches[bbox_idx][j]
                ]

                if len(matched_skeletons) > 1:
                    # Handle ambiguous matches
                    excluded_boxes_info.add_message(
                        "Sample '{}': bbox #{} ({}) and overlapping skeletons skipped - "
                        "too many matching skeletons ({}) found".format(
                            boxes_sample.id,
                            input_bbox.id,
                            boxes_label_cat[input_bbox.label].name,
                            format_sequence([f"#{a.id}" for a in matched_skeletons]),
                        ),
                        sample_id=boxes_sample.id,
                        sample_subset=boxes_sample.subset,
                    )
                    # not an error, should not be counted as excluded for an error
                    ambiguous_boxes.add(input_bbox.id)
                    ambiguous_skeletons.update(s.id for s in matched_skeletons)
                    continue

            for skeleton_idx, gt_skeleton in enumerate(gt_skeletons):
                matched_boxes: list[dm.Bbox] = [
                    input_boxes[i] for i in range(len(input_boxes)) if matches[i][skeleton_idx]
                ]

                if len(matched_boxes) > 1:
                    # Handle ambiguous matches
                    excluded_gt_info.add_message(
                        "Sample '{}': GT skeleton #{} ({}) and overlapping boxes skipped - "
                        "too many matching boxes ({}) found".format(
                            gt_sample.id,
                            gt_skeleton.id,
                            gt_label_cat[gt_skeleton.label].name,
                            format_sequence([f"#{a.id}" for a in matched_boxes]),
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    # not an error, should not be counted as excluded for an error
                    ambiguous_skeletons.add(gt_skeleton.id)
                    ambiguous_boxes.update(b.id for b in matched_boxes)
                    continue
                if not matched_boxes:
                    # Handle unmatched skeletons
                    excluded_gt_info.add_message(
                        "Sample '{}': GT skeleton #{} ({}) skipped - "
                        "no matching boxes found".format(
                            gt_sample.id,
                            gt_skeleton.id,
                            gt_label_cat[gt_skeleton.label].name,
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    excluded_gt_info.excluded_count += 1  # an error
                    continue

            unambiguous_matches: list[tuple[dm.Bbox, dm.Skeleton]] = []
            for bbox_idx, input_bbox in enumerate(input_boxes):
                if input_bbox.id in ambiguous_boxes:
                    continue

                matched_skeleton = None
                for gt_idx, gt_skeleton in enumerate(gt_skeletons):
                    if gt_skeleton.id in ambiguous_skeletons:
                        continue

                    if matches[bbox_idx][gt_idx]:
                        matched_skeleton = gt_skeleton
                        break

                if matched_skeleton:
                    unambiguous_matches.append((input_bbox, matched_skeleton))

            return unambiguous_matches

        def _find_good_gt_skeletons(
            input_boxes: list[dm.Bbox],
            gt_skeletons: list[dm.Skeleton],
            *,
            input_points: list[dm.Points],
            gt_annotations: list[dm.Annotation],
        ) -> list[dm.Skeleton]:
            matches = _find_unambiguous_matches(
                input_boxes, gt_skeletons, input_points=input_points, gt_annotations=gt_annotations
            )

            matched_skeletons = []
            for input_bbox, gt_skeleton in matches:
                gt_count_per_class[gt_skeleton.label] = (
                    gt_count_per_class.get(gt_skeleton.label, 0) + 1
                )

                matched_skeletons.append(gt_skeleton)
                skeleton_bbox_mapping[gt_skeleton.id] = input_bbox.id

            return matched_skeletons

        assert self._data_filenames is not unset
        assert self._boxes_dataset is not unset
        assert self._input_gt_dataset is not unset
        assert [
            label.name
            for label in self._input_gt_dataset.categories()[dm.AnnotationType.label]
            if not label.parent
        ] == [label.name for label in self.manifest.annotation.labels]
        assert [
            label.name
            for label in self._boxes_dataset.categories()[dm.AnnotationType.label]
            if not label.parent
        ] == [label.name for label in self.manifest.annotation.labels]

        boxes_label_cat: dm.LabelCategories = self._boxes_dataset.categories()[
            dm.AnnotationType.label
        ]
        gt_label_cat: dm.LabelCategories = self._input_gt_dataset.categories()[
            dm.AnnotationType.label
        ]

        updated_gt_dataset = dm.Dataset(
            categories=self._input_gt_dataset.categories(), media_type=dm.Image
        )

        excluded_boxes_info = ExcludedAnnotationsInfo()  # local for the function
        excluded_gt_info = self._excluded_gt_info
        gt_count_per_class = {}
        skeleton_bbox_mapping = {}  # skeleton id -> bbox id
        for gt_sample in self._input_gt_dataset:
            boxes_sample = self._boxes_dataset.get(gt_sample.id, gt_sample.subset)
            # Samples could be discarded, so we just skip them without an error
            if not boxes_sample:
                continue

            gt_skeletons = [a for a in gt_sample.annotations if isinstance(a, dm.Skeleton)]
            input_boxes = [a for a in boxes_sample.annotations if isinstance(a, dm.Bbox)]
            input_points = [a for a in boxes_sample.annotations if isinstance(a, dm.Points)]
            assert len(input_boxes) == len(input_points)

            # Samples without boxes are allowed, so we just skip them without an error
            if not gt_skeletons:
                continue

            matched_skeletons = _find_good_gt_skeletons(
                input_boxes,
                gt_skeletons,
                input_points=input_points,
                gt_annotations=gt_sample.annotations,
            )
            if not matched_skeletons:
                continue

            updated_gt_dataset.put(gt_sample.wrap(annotations=matched_skeletons))

        if excluded_boxes_info.messages:
            self.logger.warning(
                "Some boxes were excluded from GT due to the problems found: {}".format(
                    format_sequence(
                        [e.message for e in excluded_boxes_info.messages], separator="\n"
                    )
                )
            )

        if excluded_gt_info.messages:
            self.logger.warning(
                "Some GT annotations were excluded due to the errors found: {}".format(
                    format_sequence([e.message for e in excluded_gt_info.messages], separator="\n")
                )
            )

        if excluded_gt_info.excluded_count > ceil(
            self.config.max_discarded_threshold * excluded_gt_info.total_count
        ):
            raise DatasetValidationError(
                "Too many GT skeletons discarded ({} out of {}). "
                "Please make sure each GT skeleton matches exactly 1 bbox "
                "and has at least 1 visible point".format(
                    excluded_gt_info.total_count - len(skeleton_bbox_mapping),
                    excluded_gt_info.total_count,
                )
            )

        self.logger.info(
            "GT counts per class to be used for validation: {}".format(
                format_sequence(
                    [
                        f"{gt_label_cat[label_id].name}: {count}"
                        for label_id, count in gt_count_per_class.items()
                    ]
                )
            )
        )

        labels_with_few_gt = [
            gt_label_cat[label_id]
            for label_id, label_count in gt_count_per_class.items()
            if label_count < self.config.min_label_gt_samples
        ]
        if labels_with_few_gt:
            raise DatasetValidationError(
                "Too few matching GT boxes/points annotations found for some classes: {}".format(
                    format_sequence(labels_with_few_gt)
                )
            )

        self._gt_dataset = updated_gt_dataset
        self._skeleton_bbox_mapping = skeleton_bbox_mapping

    def _prepare_roi_infos(self):
        assert self._gt_dataset is not unset
        assert self._boxes_dataset is not unset

        rois: list[skeletons_from_boxes_task.RoiInfo] = []
        for sample in self._boxes_dataset:
            instances = find_instances(sample.annotations)
            for instance_anns in instances:
                bbox = next(a for a in instance_anns if isinstance(a, dm.Bbox))
                point = next(a for a in instance_anns if isinstance(a, dm.Points))

                # RoI is centered on bbox center
                original_bbox_cx = int(bbox.x + bbox.w / 2)
                original_bbox_cy = int(bbox.y + bbox.h / 2)

                roi_w = ceil(bbox.w * self.config.roi_size_mult)
                roi_h = ceil(bbox.h * self.config.roi_size_mult)
                roi_w = max(roi_w, self.config.min_roi_size[0])
                roi_h = max(roi_h, self.config.min_roi_size[1])

                roi_x = original_bbox_cx - int(roi_w / 2)
                roi_y = original_bbox_cy - int(roi_h / 2)

                new_bbox_x = bbox.x - roi_x
                new_bbox_y = bbox.y - roi_y

                rois.append(
                    skeletons_from_boxes_task.RoiInfo(
                        original_image_key=sample.attributes["id"],
                        bbox_id=bbox.id,
                        bbox_label=bbox.label,
                        bbox_x=new_bbox_x,
                        bbox_y=new_bbox_y,
                        point_x=point.points[0] - roi_x,
                        point_y=point.points[1] - roi_y,
                        roi_x=roi_x,
                        roi_y=roi_y,
                        roi_w=roi_w,
                        roi_h=roi_h,
                    )
                )

        self._roi_infos = rois
        self._roi_info_by_id = {roi_info.bbox_id: roi_info for roi_info in self._roi_infos}

    def _mangle_filenames(self):
        """
        Mangle filenames in the dataset to make them less recognizable by annotators
        and hide private dataset info
        """
        assert self._roi_infos is not unset

        # TODO: maybe add different names for the same GT images in
        # different jobs to make them even less recognizable
        self._roi_filenames = {
            roi_info.bbox_id: str(uuid.uuid4()) + self.config.roi_file_ext
            for roi_info in self._roi_infos
        }

    @property
    def _task_segment_size(self) -> int:
        # Here we use a job size multiplier, because each image
        # is supposed to be simple and the assignment is expected
        # to take little time with the default job size.
        # Then, we add a percent of job tiles for validation, keeping the requested ratio.
        return super()._task_segment_size * self.config.job_size_mult

    @property
    def _job_val_frames_count(self) -> int:
        return super()._job_val_frames_count * self.config.job_size_mult

    def _prepare_task_params(self):
        assert self._roi_infos is not unset
        assert self._skeleton_bbox_mapping is not unset
        assert self._input_gt_dataset is not unset

        # This list can be different from what is selected for validation
        input_gt_filenames = set(sample.media.path for sample in self._input_gt_dataset)
        image_id_to_filename = {
            sample.attributes["id"]: sample.media.path for sample in self._boxes_dataset
        }

        task_params: list[_TaskParams] = []
        segment_size = self._task_segment_size
        for label_id, _ in enumerate(self.manifest.annotation.labels):
            label_gt_roi_ids = set(
                roi_id
                for roi_id in self._skeleton_bbox_mapping.values()
                if self._roi_info_by_id[roi_id].bbox_label == label_id
            )

            label_data_roi_ids = [
                roi_info.bbox_id
                for roi_info in self._roi_infos
                if roi_info.bbox_label == label_id
                if roi_info.bbox_id not in label_gt_roi_ids
                if image_id_to_filename[roi_info.original_image_key] not in input_gt_filenames
            ]
            random.shuffle(label_data_roi_ids)

            task_params.extend(
                [
                    _TaskParams(
                        label_id=label_id, roi_ids=task_data_roi_ids, roi_gt_ids=label_gt_roi_ids
                    )
                    for task_data_roi_ids in take_by(
                        label_data_roi_ids, Config.cvat_config.max_jobs_per_task * segment_size
                    )
                ]
            )

        self._task_params = task_params

    def _prepare_job_labels(self):
        self._point_labels = {}

        for skeleton_label in self.manifest.annotation.labels:
            for point_name in skeleton_label.nodes:
                self._point_labels[(skeleton_label.name, point_name)] = point_name

    def _prepare_gt_points_mapping(self):
        assert self._gt_dataset is not unset

        self._gt_points_per_label = {}

        # GT should contain all GT images with only one point per skeleton node
        for gt_sample in self._gt_dataset:
            for gt_skeleton in gt_sample.annotations:
                if not isinstance(gt_skeleton, dm.Skeleton):
                    continue

                for point in gt_skeleton.elements:
                    if point.visibility[0] in [
                        dm.Points.Visibility.absent,
                        dm.Points.Visibility.hidden,
                    ]:
                        continue

                    point_label_name = (
                        self._gt_dataset.categories()[dm.AnnotationType.label]
                        .items[point.label]
                        .name
                    )

                    self._gt_points_per_label.setdefault(
                        (gt_skeleton.label, point_label_name), []
                    ).append((gt_skeleton.id, point))

    def _upload_task_meta(self):
        layout = skeletons_from_boxes_task.TaskMetaLayout()
        serializer = skeletons_from_boxes_task.TaskMetaSerializer()

        file_list = []
        file_list.append(
            (serializer.serialize_bbox_annotations(self._boxes_dataset), layout.BOXES_FILENAME)
        )
        file_list.append(
            (
                serializer.serialize_gt_annotations(self._gt_dataset),
                layout.GT_FILENAME,
            )
        )
        file_list.append(
            (
                serializer.serialize_skeleton_bbox_mapping(self._skeleton_bbox_mapping),
                layout.SKELETON_BBOX_MAPPING_FILENAME,
            )
        )
        file_list.append((serializer.serialize_roi_info(self._roi_infos), layout.ROI_INFO_FILENAME))
        file_list.append(
            (serializer.serialize_roi_filenames(self._roi_filenames), layout.ROI_FILENAMES_FILENAME)
        )
        file_list.append(
            (serializer.serialize_point_labels(self._point_labels), layout.POINT_LABELS_FILENAME)
        )

        storage_client = self._make_cloud_storage_client(self._oracle_data_bucket)
        for file_data, filename in file_list:
            storage_client.create_file(
                compose_data_bucket_filename(self.escrow_address, self.chain_id, filename),
                file_data,
            )

    def _extract_roi(
        self, source_pixels: np.ndarray, roi_info: skeletons_from_boxes_task.RoiInfo
    ) -> np.ndarray:
        img_h, img_w, *_ = source_pixels.shape

        roi_pixels = source_pixels[
            max(0, roi_info.roi_y) : min(img_h, roi_info.roi_y + roi_info.roi_h),
            max(0, roi_info.roi_x) : min(img_w, roi_info.roi_x + roi_info.roi_w),
        ]

        if not (
            (0 <= roi_info.roi_x < roi_info.roi_x + roi_info.roi_w < img_w)
            and (0 <= roi_info.roi_y < roi_info.roi_y + roi_info.roi_h < img_h)
        ):
            # Coords can be outside the original image
            # In this case a border should be added to RoI, so that the image was centered on bbox
            wrapped_roi_pixels = np.zeros((roi_info.roi_h, roi_info.roi_w, 3), dtype=np.float32)
            wrapped_roi_pixels[:, :] = self.config.roi_background_color

            dst_y = max(-roi_info.roi_y, 0)
            dst_x = max(-roi_info.roi_x, 0)
            wrapped_roi_pixels[
                dst_y : dst_y + roi_pixels.shape[0],
                dst_x : dst_x + roi_pixels.shape[1],
            ] = roi_pixels

            roi_pixels = wrapped_roi_pixels
        else:
            roi_pixels = roi_pixels.copy()

        return roi_pixels

    def _draw_roi_bbox(self, roi_image: np.ndarray, bbox: dm.Bbox) -> np.ndarray:
        roi_cy = roi_image.shape[0] // 2
        roi_cx = roi_image.shape[1] // 2
        return cv2.rectangle(
            roi_image,
            tuple(map(int, (roi_cx - bbox.w / 2, roi_cy - bbox.h / 2))),
            tuple(map(int, (roi_cx + bbox.w / 2, roi_cy + bbox.h / 2))),
            self.config.roi_embedded_bbox_color,
            1,
            cv2.LINE_4,
        )

    def _draw_roi_point(self, roi_image: np.ndarray, point: tuple[float, float]) -> np.ndarray:
        roi_r = (roi_image.shape[0] ** 2 + roi_image.shape[1] ** 2) ** 0.5 / 2
        radius = int(
            min(
                self.config.max_embedded_point_radius_percent * roi_r,
                max(
                    self.config.embedded_point_radius,
                    self.config.min_embedded_point_radius_percent * roi_r,
                ),
            )
        )

        roi_image = cv2.circle(
            roi_image,
            tuple(map(int, (point[0], point[1]))),
            radius + 1,
            (255, 255, 255),
            -1,
            cv2.LINE_4,
        )
        return cv2.circle(
            roi_image,
            tuple(map(int, (point[0], point[1]))),
            radius,
            self.config.embedded_point_color,
            -1,
            cv2.LINE_4,
        )

    def _extract_and_upload_rois(self):
        assert self._roi_filenames is not unset
        assert self._roi_infos is not unset

        src_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
        src_prefix = src_bucket.path
        dst_bucket = self._oracle_data_bucket

        src_client = self._make_cloud_storage_client(src_bucket)
        dst_client = self._make_cloud_storage_client(dst_bucket)

        image_id_to_filename = {
            sample.attributes["id"]: sample.image.path for sample in self._boxes_dataset
        }

        filename_to_sample = {sample.image.path: sample for sample in self._boxes_dataset}

        def _roi_info_key(e):
            return e.original_image_key

        roi_info_by_image: dict[str, Sequence[skeletons_from_boxes_task.RoiInfo]] = {
            image_id_to_filename[image_id]: list(g)
            for image_id, g in groupby(
                sorted(self._roi_infos, key=_roi_info_key), key=_roi_info_key
            )
        }

        bbox_by_id = {
            bbox.id: bbox
            for sample in self._boxes_dataset
            for bbox in sample.annotations
            if isinstance(bbox, dm.Bbox)
        }

        def process_file(filename: str, image_pixels: np.ndarray):
            image_roi_infos = roi_info_by_image.get(filename, [])
            if not image_roi_infos:
                return

            sample = filename_to_sample[filename]
            if tuple(sample.image.size) != tuple(image_pixels.shape[:2]):
                # TODO: maybe rois should be regenerated instead
                # Option 2: accumulate errors, fail when some threshold is reached
                # Option 3: add special handling for cases when image is only rotated (exif etc.)
                raise InvalidImageInfo(
                    f"Sample '{filename}': invalid size provided in the point annotations"
                )

            for roi_info in image_roi_infos:
                roi_pixels = self._extract_roi(image_pixels, roi_info)

                if self.config.embed_bbox_in_roi_image:
                    roi_pixels = self._draw_roi_bbox(roi_pixels, bbox_by_id[roi_info.bbox_id])
                    roi_pixels = self._draw_roi_point(
                        roi_pixels, (roi_info.point_x, roi_info.point_y)
                    )

                filename = self._roi_filenames[roi_info.bbox_id]
                roi_bytes = encode_image(roi_pixels, os.path.splitext(filename)[-1])

                dst_client.create_file(
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, filename),
                    data=roi_bytes,
                )

        def download_and_decode(key: str):
            image_bytes = src_client.download_file(key)
            return decode_image(image_bytes)

        pool_size = Config.features.max_data_storage_connections
        download_queue_size = 4 * pool_size
        download_queue = Queue[tuple[str, Future[np.ndarray]]](download_queue_size)
        roi_uploader = BufferedRoiImageUploader(queue=download_queue)
        with ThreadPoolExecutor(pool_size) as pool:

            def put_callback(filename: str):
                image_roi_infos = roi_info_by_image.get(filename, [])
                if not image_roi_infos:
                    return None

                return (
                    filename,
                    pool.submit(download_and_decode, os.path.join(src_prefix, filename)),
                )

            def process_callback(result: tuple[str, Future]):
                filename, task = result
                process_file(filename, task.result())

            roi_uploader.process_all(
                self._data_filenames, put_callback=put_callback, process_callback=process_callback
            )

    def _prepare_gt_dataset_for_skeleton_point(
        self,
        *,
        point_label_name: str,
        skeleton_label_id: int,
    ) -> dm.Dataset:
        assert self._gt_points_per_label is not unset

        # Change annotations to Points for validation in CVAT,
        # as annotators will use this annotation type
        point_dataset = dm.Dataset(
            categories={
                dm.AnnotationType.label: dm.LabelCategories.from_iterable([point_label_name]),
            },
            media_type=dm.Image,
        )

        for gt_skeleton_id, gt_point in self._gt_points_per_label[
            (skeleton_label_id, point_label_name)
        ]:
            roi_key = self._skeleton_bbox_mapping[gt_skeleton_id]
            roi_info = self._roi_info_by_id[roi_key]

            mangled_cvat_sample_id = compose_data_bucket_filename(
                self.escrow_address,
                self.chain_id,
                os.path.splitext(self._roi_filenames[roi_key])[0],
            )

            # update points coordinates in accordance with roi coordinates
            updated_points = [
                gt_point.points[0] - roi_info.roi_x,
                gt_point.points[1] - roi_info.roi_y,
            ]

            point_dataset.put(
                dm.DatasetItem(
                    id=mangled_cvat_sample_id,
                    annotations=[dm.Points(id=gt_skeleton_id, points=updated_points, label=0)],
                )
            )

        return point_dataset

    def _save_cvat_gt_dataset_to_oracle_bucket(
        self,
        gt_dataset_path: Path,
        *,
        file_suffix: str = "",
    ) -> None:
        layout = skeletons_from_boxes_task.TaskMetaLayout()

        base_gt_filename = layout.GT_FILENAME.split(".", maxsplit=1)[0]
        final_gt_filename = f"{base_gt_filename}_{file_suffix}" + ".zip"
        gt_dataset_key = compose_data_bucket_filename(
            self.escrow_address, self.chain_id, final_gt_filename
        )

        storage_client = self._make_cloud_storage_client(self._oracle_data_bucket)
        storage_client.create_file(gt_dataset_key, gt_dataset_path.read_bytes())

    def _setup_quality_settings(self, task_id: int, **overrides) -> None:
        values = {
            "oks_sigma": Config.cvat_config.oks_sigma,
            "point_size_base": "image_size",  # we don't expect any boxes or groups, so ignore them
        }
        values.update(overrides)
        super()._setup_quality_settings(task_id, **values)

    def _create_on_cvat(self):
        assert self._task_params is not unset
        assert self._point_labels is not unset
        assert self._gt_points_per_label is not unset

        def _task_params_label_key(ts):
            return ts.label_id

        tasks_by_skeleton_label = {
            skeleton_label_id: list(g)
            for skeleton_label_id, g in groupby(
                sorted(self._task_params, key=_task_params_label_key), key=_task_params_label_key
            )
        }

        label_specs_by_skeleton = {
            skeleton_label_id: [
                {
                    "name": self._point_labels[(skeleton_label.name, skeleton_point)],
                    "type": "points",
                }
                for skeleton_point in skeleton_label.nodes
            ]
            for skeleton_label_id, skeleton_label in enumerate(self.manifest.annotation.labels)
        }

        oracle_bucket = self._oracle_data_bucket

        # Register cloud storage on CVAT to pass user dataset
        cvat_cloud_storage = cvat_api.create_cloudstorage(
            **make_cvat_cloud_storage_params(oracle_bucket)
        )

        segment_size = self._task_segment_size

        total_jobs = sum(
            len(self.manifest.annotation.labels[tp.label_id].nodes)
            * (math.ceil(len(tp.roi_ids) / segment_size))
            for tp in self._task_params
        )
        self.logger.info(
            "Task creation for escrow '%s': will create %s assignments",
            self.escrow_address,
            total_jobs,
        )

        with SessionLocal.begin() as session:
            db_service.create_escrow_creation(
                session,
                escrow_address=self.escrow_address,
                chain_id=self.chain_id,
                total_jobs=total_jobs,
            )
            created_projects = []

            for skeleton_label_id, skeleton_label_tasks in tasks_by_skeleton_label.items():
                skeleton_label_filenames: list[list[str]] = []
                gt_skeleton_label_filenames: list[list[str]] = []

                for skeleton_label_task in skeleton_label_tasks:
                    skeleton_label_filenames.append(
                        [
                            compose_data_bucket_filename(
                                self.escrow_address, self.chain_id, self._roi_filenames[roi_id]
                            )
                            for roi_id in skeleton_label_task.roi_ids
                        ],
                    )

                    gt_skeleton_label_filenames.append(
                        [
                            compose_data_bucket_filename(
                                self.escrow_address, self.chain_id, self._roi_filenames[roi_id]
                            )
                            for roi_id in skeleton_label_task.roi_gt_ids
                        ],
                    )

                for point_label_spec in label_specs_by_skeleton[skeleton_label_id]:
                    point_label_name = point_label_spec["name"]

                    # Create a project for each point label.
                    # CVAT doesn't support tasks with different labels in a project.
                    cvat_project = cvat_api.create_project(
                        name="{} ({} {})".format(
                            self.escrow_address,
                            self.manifest.annotation.labels[skeleton_label_id].name,
                            point_label_name,
                        ),
                        user_guide=self.manifest.annotation.user_guide,
                        labels=[point_label_spec],
                        # TODO: improve guide handling - split for different points
                    )

                    # Setup webhooks for the project
                    cvat_webhook = cvat_api.create_cvat_webhook(cvat_project.id)

                    project_id = db_service.create_project(
                        session,
                        cvat_project.id,
                        cvat_cloud_storage.id,
                        self.manifest.annotation.type,
                        self.escrow_address,
                        self.chain_id,
                        oracle_bucket.to_url().rstrip("/")
                        + "/"
                        + compose_data_bucket_prefix(self.escrow_address, self.chain_id),
                        cvat_webhook_id=cvat_webhook.id,
                    )
                    created_projects.append(project_id)

                    db_service.get_project_by_id(
                        session, project_id, for_update=True
                    )  # lock the row
                    db_service.add_project_images(
                        session,
                        cvat_project.id,
                        list(set(chain.from_iterable(skeleton_label_filenames))),
                    )

                    for point_label_filenames, gt_point_label_filenames in zip(
                        skeleton_label_filenames, gt_skeleton_label_filenames, strict=False
                    ):
                        cvat_task = cvat_api.create_task(
                            cvat_project.id,
                            name=cvat_project.name,
                            segment_size=segment_size,
                        )

                        task_id = db_service.create_task(
                            session, cvat_task.id, cvat_project.id, TaskStatuses[cvat_task.status]
                        )
                        db_service.get_task_by_id(session, task_id, for_update=True)  # lock the row

                        # The task is fully created once 'update:task' webhook is received.
                        cvat_api.put_task_data(
                            cvat_task.id,
                            cvat_cloud_storage.id,
                            filenames=point_label_filenames + gt_point_label_filenames,
                            validation_params={
                                "gt_filenames": gt_point_label_filenames,
                                "gt_frames_per_job_count": self._job_val_frames_count,
                            },
                        )

                        gt_point_dataset = self._prepare_gt_dataset_for_skeleton_point(
                            point_label_name=point_label_name,
                            skeleton_label_id=skeleton_label_id,
                        )

                        self._setup_gt_job_for_cvat_task(
                            cvat_task.id, gt_point_dataset, dm_export_format="cvat"
                        )
                        self._setup_quality_settings(
                            cvat_task.id, oks_sigma=Config.cvat_config.oks_sigma
                        )

                        db_service.create_data_upload(session, cvat_task.id)

            db_service.touch(session, Project, created_projects)

    def build(self):
        self._download_input_data()
        self._parse_gt()
        self._parse_boxes()
        self._validate_gt()
        self._validate_boxes()

        # Task configuration creation
        self._prepare_gt()
        self._prepare_roi_infos()
        self._prepare_task_params()
        self._mangle_filenames()
        self._prepare_job_labels()

        # Data preparation
        self._extract_and_upload_rois()
        self._upload_task_meta()
        self._prepare_gt_points_mapping()

        self._create_on_cvat()
