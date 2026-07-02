from __future__ import annotations

import math
import os
import uuid
from concurrent.futures import Future, ThreadPoolExecutor
from itertools import groupby
from math import ceil
from pathlib import Path
from queue import Queue
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING, cast

import cv2
import datumaro as dm
import numpy as np
from datumaro.util import filter_dict
from datumaro.util.image import decode_image, encode_image

import src.core.tasks.boxes_from_points as boxes_from_points_task
import src.core.tasks.skeletons_from_boxes as skeletons_from_boxes_task
import src.cvat.api_calls as cvat_api
import src.services.cvat as db_service
from src.core.config import Config
from src.core.storage import compose_data_bucket_filename, compose_data_bucket_prefix
from src.core.types import TaskStatuses
from src.db import SessionLocal
from src.models.cvat import Project
from src.services.cloud.utils import BucketAccessInfo
from src.utils.annotations import ProjectLabels, is_point_in_bbox
from src.utils.logging import format_sequence
from src.utils.roi_uploader import BufferedRoiImageUploader

if TYPE_CHECKING:
    from collections.abc import Sequence

    from src.core.manifest.v1 import JobManifest

from src.core.tasks.cvat_formats import DM_GT_DATASET_FORMAT_MAPPING
from src.handlers.job_creation.builders.vision.base import TaskBuilderBase
from src.handlers.job_creation.exceptions import (
    DatasetValidationError,
    InvalidCategories,
    InvalidCoordinates,
    InvalidImageInfo,
    MismatchingAnnotations,
    TooFewSamples,
)
from src.handlers.job_creation.utils import (
    ExcludedAnnotationsInfo,
    MaybeUnset,
    filter_image_files,
    make_cvat_cloud_storage_params,
    make_cvat_label_configuration,
    strip_bucket_prefix,
    unset,
)


class BoxesFromPointsTaskBuilder(TaskBuilderBase):
    def __init__(self, manifest: JobManifest, escrow_address: str, chain_id: int) -> None:
        super().__init__(manifest=manifest, escrow_address=escrow_address, chain_id=chain_id)

        self._input_gt_data: MaybeUnset[bytes] = unset
        self._input_points_data: MaybeUnset[bytes] = unset

        self._data_filenames: MaybeUnset[Sequence[str]] = unset
        self._input_gt_dataset: MaybeUnset[dm.Dataset] = unset
        self._gt_dataset: MaybeUnset[dm.Dataset] = unset
        self._gt_roi_dataset: MaybeUnset[dm.Dataset] = unset
        self._points_dataset: MaybeUnset[dm.Dataset] = unset

        self._bbox_point_mapping: MaybeUnset[boxes_from_points_task.BboxPointMapping] = unset
        "bbox_id -> point_id"

        self._roi_size_estimations: MaybeUnset[dict[int, tuple[float, float]]] = unset
        "label_id -> (rel. w, rel. h)"

        self._rois: MaybeUnset[boxes_from_points_task.RoiInfos] = unset
        self._roi_filenames: MaybeUnset[boxes_from_points_task.RoiFilenames] = unset
        self._roi_filenames_to_be_annotated: MaybeUnset[Sequence[str]] = unset
        self._gt_roi_filenames: MaybeUnset[Sequence[str]] = unset

        self._job_layout: MaybeUnset[Sequence[Sequence[str]]] = unset
        "File lists per CVAT job"

        self._label_configuration: MaybeUnset[Sequence[dict]] = unset

        self._excluded_points_info: MaybeUnset[ExcludedAnnotationsInfo] = unset
        self._excluded_gt_info: MaybeUnset[ExcludedAnnotationsInfo] = unset

        # Configuration / constants
        # TODO: consider WebP if produced files are too big
        self.roi_file_ext = ".png"  # supposed to be lossless and reasonably compressing
        "File extension for RoI images, with leading dot (.) included"

        self.list_display_threshold = 5
        "The maximum number of rendered list items in a message"

        self.roi_size_mult = 1.1
        "Additional point ROI size multiplier"

        self.min_roi_size = (
            Config.core_config.min_roi_size_w,
            Config.core_config.min_roi_size_h,
        )
        "Minimum absolute ROI size, (w, h)"

        self.points_format = "coco_person_keypoints"

        self.embed_point_in_roi_image = True
        "Put a small point into the extracted RoI images for the original point"

        self.embedded_point_radius = 15
        self.min_embedded_point_radius_percent = 0.005
        self.max_embedded_point_radius_percent = 0.01
        self.embedded_point_color = (0, 255, 255)
        self.roi_background_color = (245, 240, 242)  # BGR - CVAT background color

        self.oracle_data_bucket = BucketAccessInfo.parse_obj(Config.storage_config)

        self.min_class_samples_for_roi_estimation = 25

        self.max_class_roi_image_side_threshold = 0.5
        """
        The maximum allowed percent of the image for the estimated class RoI,
        before the default RoI is used. Too big RoI estimations reduce the overall
        prediction quality, making them unreliable.
        """

        self.max_discarded_threshold = 0.5
        """
        The maximum allowed percent of discarded
        GT boxes, points, or samples for successful job launch
        """

        # TODO: probably, need to also add an absolute number of minimum GT RoIs

    def _download_input_data(self):
        data_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
        gt_bucket = BucketAccessInfo.parse_obj(self.manifest.validation.gt_url)
        points_bucket = BucketAccessInfo.parse_obj(self.manifest.data.points_url)

        data_storage_client = self._make_cloud_storage_client(data_bucket)
        gt_storage_client = self._make_cloud_storage_client(gt_bucket)
        points_storage_client = self._make_cloud_storage_client(points_bucket)

        data_filenames = data_storage_client.list_files(prefix=data_bucket.path)
        data_filenames = strip_bucket_prefix(data_filenames, prefix=data_bucket.path)
        self._data_filenames = filter_image_files(data_filenames)

        self._input_gt_data = gt_storage_client.download_file(gt_bucket.path)
        self._input_gt_filename = Path(gt_bucket.path).name

        self._input_points_data = points_storage_client.download_file(points_bucket.path)

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

    def _parse_points(self):
        assert self._input_points_data is not unset

        self._points_dataset = self._parse_dataset(
            self._input_points_data, dataset_format=self.points_format
        )

    def _validate_gt_labels(self):
        gt_labels = set(
            label.name
            for label in self._input_gt_dataset.categories()[dm.AnnotationType.label]
            if not label.parent
        )
        manifest_labels = set(label.name for label in self.manifest.annotation.labels)
        if gt_labels - manifest_labels:
            raise DatasetValidationError(
                "GT labels do not match job labels. Unknown labels: {}".format(
                    format_sequence(list(gt_labels - manifest_labels)),
                )
            )

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
        label_cat: dm.LabelCategories = self._input_gt_dataset.categories()[dm.AnnotationType.label]

        excluded_gt_info = ExcludedAnnotationsInfo()
        excluded_samples = set()
        visited_ids = set()
        for gt_sample in self._input_gt_dataset:
            # Could fail on this as well
            img_h, img_w = gt_sample.media_as(dm.Image).size

            sample_boxes = [a for a in gt_sample.annotations if isinstance(a, dm.Bbox)]
            valid_boxes = []
            for bbox in sample_boxes:
                if not (
                    (0 <= int(bbox.x) < int(bbox.x + bbox.w) <= img_w)
                    and (0 <= int(bbox.y) < int(bbox.y + bbox.h) <= img_h)
                ):
                    excluded_gt_info.add_message(
                        "Sample '{}': GT bbox #{} ({}) - invalid coordinates".format(
                            gt_sample.id, bbox.id, label_cat[bbox.label].name
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    continue

                if bbox.id in visited_ids:
                    excluded_gt_info.add_message(
                        "Sample '{}': GT bbox #{} ({}) skipped - repeated annotation id {}".format(
                            gt_sample.id, bbox.id, label_cat[bbox.label].name, bbox.id
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    continue

                valid_boxes.append(bbox)

            excluded_gt_info.excluded_count += len(sample_boxes) - len(valid_boxes)
            excluded_gt_info.total_count += len(sample_boxes)

            if len(valid_boxes) != len(sample_boxes):
                if not valid_boxes:
                    excluded_samples.add((gt_sample.id, gt_sample.subset))
                else:
                    self._input_gt_dataset.put(gt_sample.wrap(annotations=valid_boxes))

        for excluded_sample in excluded_samples:
            self._input_gt_dataset.remove(*excluded_sample)

        if excluded_gt_info.excluded_count:
            self.logger.warning(
                "Some GT boxes were excluded due to the errors found: \n{}".format(
                    format_sequence([e.message for e in excluded_gt_info.messages], separator="\n")
                )
            )

        if excluded_gt_info.excluded_count > ceil(
            excluded_gt_info.total_count * self.max_discarded_threshold
        ):
            raise TooFewSamples(
                "Too many GT boxes discarded, canceling job creation. Errors: {}".format(
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

    def _validate_points_categories(self):
        invalid_point_categories_messages = []
        points_dataset_categories = self._points_dataset.categories()
        points_dataset_label_cat: dm.LabelCategories = points_dataset_categories[
            dm.AnnotationType.label
        ]
        for category_id, category in points_dataset_categories[
            dm.AnnotationType.points
        ].items.items():
            if len(category.labels) != 1:
                invalid_point_categories_messages.append(
                    "Category '{}' (#{}): {}".format(
                        points_dataset_label_cat[category_id].name,
                        category_id,
                        f"too many skeleton points ({len(category.labels)}), only 1 expected",
                    )
                )

        if invalid_point_categories_messages:
            raise InvalidCategories(
                "Invalid categories in the input point annotations: {}".format(
                    format_sequence(invalid_point_categories_messages, separator="; ")
                )
            )

        points_labels = set(label.name for label in points_dataset_label_cat if not label.parent)
        manifest_labels = set(label.name for label in self.manifest.annotation.labels)
        if manifest_labels != points_labels:
            raise DatasetValidationError("Point labels do not match job labels")

        self._points_dataset.transform(
            ProjectLabels, dst_labels=[label.name for label in self.manifest.annotation.labels]
        )
        self._points_dataset.init_cache()

    def _validate_points_filenames(self):
        points_filenames = set(sample.id + sample.media.ext for sample in self._points_dataset)

        known_data_filenames = set(self._data_filenames)
        matched_points_filenames = points_filenames.intersection(known_data_filenames)

        if len(matched_points_filenames) != len(points_filenames):
            extra_point_samples = list(
                map(os.path.basename, points_filenames - matched_points_filenames)
            )

            raise MismatchingAnnotations(
                "Failed to find several samples in the dataset files: {}".format(
                    format_sequence(extra_point_samples),
                )
            )

    def _validate_points_annotations(self):
        def _validate_skeleton(skeleton: dm.Skeleton, *, sample_bbox: dm.Bbox):
            if skeleton.id in visited_ids:
                raise DatasetValidationError(f"repeated annotation id ({skeleton.id})")

            if len(skeleton.elements) != 1:
                raise DatasetValidationError(
                    f"invalid points count ({len(skeleton.elements)}), expected 1"
                )

            point = skeleton.elements[0]
            px, py = point.points[:2]
            if not is_point_in_bbox(px, py, sample_bbox):
                raise InvalidCoordinates("coordinates are outside image")

        label_cat: dm.LabelCategories = self._points_dataset.categories()[dm.AnnotationType.label]

        excluded_points_info = ExcludedAnnotationsInfo()
        excluded_samples = set()
        visited_ids = set()
        for sample in self._points_dataset:
            # Could fail on this as well
            image_h, image_w = sample.image.size
            sample_bbox = dm.Bbox(0, 0, w=image_w, h=image_h)

            sample_skeletons = [a for a in sample.annotations if isinstance(a, dm.Skeleton)]
            valid_skeletons = []
            for skeleton in sample_skeletons:
                # Here 1 skeleton describes 1 point
                try:
                    _validate_skeleton(skeleton, sample_bbox=sample_bbox)
                except InvalidCoordinates as error:
                    excluded_points_info.add_message(
                        "Sample '{}': point #{} ({}) skipped - {}".format(
                            sample.id, skeleton.id, label_cat[skeleton.label].name, error
                        ),
                        sample_id=sample.id,
                        sample_subset=sample.subset,
                    )
                    continue
                except DatasetValidationError as error:
                    excluded_points_info.add_message(
                        "Sample '{}': point #{} ({}) - {}".format(
                            sample.id, skeleton.id, label_cat[skeleton.label].name, error
                        ),
                        sample_id=sample.id,
                        sample_subset=sample.subset,
                    )
                    continue

                valid_skeletons.append(skeleton)

            excluded_points_info.excluded_count += len(sample_skeletons) - len(valid_skeletons)
            excluded_points_info.total_count += len(sample_skeletons)

            if len(valid_skeletons) != len(sample_skeletons):
                if not valid_skeletons:
                    excluded_samples.add((sample.id, sample.subset))
                else:
                    self._points_dataset.put(sample.wrap(annotations=valid_skeletons))

        for excluded_sample in excluded_samples:
            self._points_dataset.remove(*excluded_sample)

        if excluded_points_info.excluded_count:
            self.logger.warning(
                "Some points were excluded due to the errors found: \n{}".format(
                    format_sequence(
                        [e.message for e in excluded_points_info.messages], separator="\n"
                    )
                )
            )

        if excluded_points_info.excluded_count > ceil(
            excluded_points_info.total_count * self.max_discarded_threshold
        ):
            raise TooFewSamples(
                "Too many points discarded, canceling job creation. Errors: {}".format(
                    format_sequence(
                        [error_info.message for error_info in excluded_points_info.messages]
                    )
                )
            )

        self._excluded_points_info = excluded_points_info

    def _validate_points(self):
        assert self._data_filenames is not unset
        assert self._points_dataset is not unset

        self._validate_points_categories()
        self._validate_points_filenames()
        self._validate_points_annotations()

    @staticmethod
    def _is_point_in_bbox(px: float, py: float, bbox: dm.Bbox) -> bool:
        return is_point_in_bbox(px, py, bbox)

    def _prepare_gt(self):
        def _find_unambiguous_matches(
            input_skeletons: list[dm.Skeleton],
            gt_boxes: list[dm.Bbox],
        ) -> list[tuple[dm.Skeleton, dm.Bbox]]:
            matches = [
                [
                    (input_skeleton.label == gt_bbox.label)
                    and (
                        self._is_point_in_bbox(
                            *input_skeleton.elements[0].points[0:2], bbox=gt_bbox
                        )
                    )
                    for gt_bbox in gt_boxes
                ]
                for input_skeleton in input_skeletons
            ]

            ambiguous_boxes: list[int] = set()
            ambiguous_skeletons: list[int] = set()
            for skeleton_idx, input_skeleton in enumerate(input_skeletons):
                matched_boxes: list[dm.Bbox] = [
                    gt_boxes[j] for j in range(len(gt_boxes)) if matches[skeleton_idx][j]
                ]

                if len(matched_boxes) > 1:
                    # Handle ambiguous matches
                    excluded_points_info.add_message(
                        "Sample '{}': point #{} ({}) and overlapping boxes skipped - "
                        "too many matching boxes ({}) found".format(
                            points_sample.id,
                            input_skeleton.id,
                            points_label_cat[input_skeleton.label].name,
                            format_sequence([f"#{a.id}" for a in matched_boxes]),
                        ),
                        sample_id=points_sample.id,
                        sample_subset=points_sample.subset,
                    )
                    # not an error, should not be counted as excluded for an error
                    ambiguous_skeletons.add(input_skeleton.id)
                    ambiguous_boxes.update(a.id for a in matched_boxes)
                    continue

            for gt_idx, gt_bbox in enumerate(gt_boxes):
                matched_skeletons: list[dm.Skeleton] = [
                    input_skeletons[i] for i in range(len(input_skeletons)) if matches[i][gt_idx]
                ]

                if len(matched_skeletons) > 1:
                    # Handle ambiguous matches
                    excluded_gt_info.add_message(
                        "Sample '{}': GT bbox #{} ({}) and overlapping points skipped - "
                        "too many matching points ({}) found".format(
                            gt_sample.id,
                            gt_bbox.id,
                            gt_label_cat[gt_bbox.label].name,
                            format_sequence([f"#{a.id}" for a in matched_skeletons]),
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    # not an error, should not be counted as excluded for an error
                    ambiguous_boxes.add(gt_bbox.id)
                    ambiguous_skeletons.update(a.id for a in matched_skeletons)
                    continue
                if not matched_skeletons:
                    # Handle unmatched skeletons
                    excluded_gt_info.add_message(
                        "Sample '{}': GT bbox #{} ({}) skipped - no matching points found".format(
                            gt_sample.id,
                            gt_bbox.id,
                            gt_label_cat[gt_bbox.label].name,
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    excluded_gt_info.excluded_count += 1  # an error
                    continue

            unambiguous_matches: list[tuple[dm.Bbox, dm.Skeleton]] = []
            for skeleton_idx, input_skeleton in enumerate(input_skeletons):
                if input_skeleton.id in ambiguous_skeletons:
                    continue

                matched_bbox = None
                for gt_idx, gt_bbox in enumerate(gt_boxes):
                    if gt_bbox.id in ambiguous_boxes:
                        continue

                    if matches[skeleton_idx][gt_idx]:
                        matched_bbox = gt_bbox
                        break

                if matched_bbox:
                    unambiguous_matches.append((input_skeleton, matched_bbox))

            return unambiguous_matches

        def _find_good_gt_boxes(
            input_skeletons: list[dm.Skeleton],
            gt_boxes: list[dm.Bbox],
        ) -> list[dm.Bbox]:
            matches = _find_unambiguous_matches(input_skeletons, gt_boxes)

            matched_boxes = []
            for input_skeleton, gt_bbox in matches:
                gt_count_per_class[gt_bbox.label] = gt_count_per_class.get(gt_bbox.label, 0) + 1

                matched_boxes.append(gt_bbox)
                bbox_point_mapping[gt_bbox.id] = input_skeleton.id

            return matched_boxes

        assert self._data_filenames is not unset
        assert self._points_dataset is not unset
        assert self._input_gt_dataset is not unset
        assert [
            label.name for label in self._input_gt_dataset.categories()[dm.AnnotationType.label]
        ] == [label.name for label in self.manifest.annotation.labels]
        assert [
            label.name
            for label in self._points_dataset.categories()[dm.AnnotationType.label]
            if not label.parent
        ] == [label.name for label in self.manifest.annotation.labels]

        points_label_cat: dm.LabelCategories = self._points_dataset.categories()[
            dm.AnnotationType.label
        ]
        gt_label_cat: dm.LabelCategories = self._input_gt_dataset.categories()[
            dm.AnnotationType.label
        ]

        updated_gt_dataset = dm.Dataset(
            categories=self._input_gt_dataset.categories(), media_type=dm.Image
        )

        excluded_points_info = ExcludedAnnotationsInfo()  # local for the function
        excluded_gt_info = self._excluded_gt_info
        gt_count_per_class = {}
        bbox_point_mapping = {}  # bbox id -> point id
        for gt_sample in self._input_gt_dataset:
            points_sample = self._points_dataset.get(gt_sample.id, gt_sample.subset)
            assert points_sample

            gt_boxes = [a for a in gt_sample.annotations if isinstance(a, dm.Bbox)]
            input_skeletons = [a for a in points_sample.annotations if isinstance(a, dm.Skeleton)]

            # Samples without boxes are allowed, so we just skip them without an error
            if not gt_boxes:
                continue

            matched_boxes = _find_good_gt_boxes(input_skeletons, gt_boxes)
            if not matched_boxes:
                continue

            updated_gt_dataset.put(gt_sample.wrap(annotations=matched_boxes))

        if excluded_points_info.messages:
            self.logger.warning(
                "Some points were excluded from GT due to the problems found: \n{}".format(
                    format_sequence(
                        [e.message for e in excluded_points_info.messages], separator="\n"
                    )
                )
            )

        if excluded_gt_info.messages:
            self.logger.warning(
                "Some GT annotations were excluded due to the problems found: \n{}".format(
                    format_sequence([e.message for e in excluded_gt_info.messages], separator="\n")
                )
            )

        if excluded_gt_info.excluded_count > ceil(
            excluded_gt_info.total_count * self.max_discarded_threshold
        ):
            raise DatasetValidationError(
                "Too many GT boxes discarded ({} out of {}). "
                "Please make sure each GT box matches exactly 1 point".format(
                    excluded_gt_info.total_count - len(bbox_point_mapping),
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

        gt_labels_without_anns = [
            gt_label_cat[label_id]
            for label_id, label_count in gt_count_per_class.items()
            if not label_count
        ]
        if gt_labels_without_anns:
            raise DatasetValidationError(
                "No matching GT boxes/points annotations found for some classes: {}".format(
                    format_sequence(gt_labels_without_anns)
                )
            )

        self._gt_dataset = updated_gt_dataset
        self._bbox_point_mapping = bbox_point_mapping

    def _estimate_roi_sizes(self):
        assert self._gt_dataset is not unset
        assert [label.name for label in self._gt_dataset.categories()[dm.AnnotationType.label]] == [
            label.name for label in self.manifest.annotation.labels
        ]

        bbox_sizes_per_label = {}
        for sample in self._gt_dataset:
            image_h, image_w = self._points_dataset.get(sample.id, sample.subset).image.size

            for gt_bbox in sample.annotations:
                gt_bbox = cast("dm.Bbox", gt_bbox)
                bbox_sizes_per_label.setdefault(gt_bbox.label, []).append(
                    (
                        gt_bbox.w / image_w,
                        gt_bbox.h / image_h,
                    )
                )

        # Consider bbox sides as normally-distributed random variables, estimate max
        # For big enough datasets, it should be reasonable approximation
        # (due to the central limit theorem). This can work bad for small datasets,
        # so we only do this if there are enough class samples.
        classes_with_default_roi: dict[int, str] = {}  # label_id -> reason
        roi_size_estimations_per_label = {}  # label id -> (w, h)
        default_roi_size = (2, 2)  # 2 will yield just the image size after halving
        for label_id, label_sizes in bbox_sizes_per_label.items():
            if len(label_sizes) < self.min_class_samples_for_roi_estimation:
                estimated_size = default_roi_size
                classes_with_default_roi[label_id] = "too few GT provided"
            else:
                max_bbox = np.max(label_sizes, axis=0)
                if np.any(max_bbox > self.max_class_roi_image_side_threshold):
                    estimated_size = default_roi_size
                    classes_with_default_roi[label_id] = "estimated RoI is unreliable"
                else:
                    estimated_size = 2 * max_bbox * self.roi_size_mult

            roi_size_estimations_per_label[label_id] = estimated_size

        if classes_with_default_roi:
            label_cat = self._gt_dataset.categories()[dm.AnnotationType.label]
            labels_by_reason = {
                g_reason: [v[0] for v in g_items]
                for g_reason, g_items in groupby(
                    sorted(classes_with_default_roi.items(), key=lambda v: v[1]), key=lambda v: v[1]
                )
            }
            self.logger.warning(
                "Some classes will use the full image instead of RoI - {}".format(
                    "; ".join(
                        "{}: {}".format(
                            g_reason,
                            format_sequence([label_cat[label_id].name for label_id in g_labels]),
                        )
                        for g_reason, g_labels in labels_by_reason.items()
                    )
                )
            )

        self._roi_size_estimations = roi_size_estimations_per_label

    def _prepare_roi_info(self):
        assert self._gt_dataset is not unset
        assert self._roi_size_estimations is not unset
        assert self._points_dataset is not unset

        rois: list[boxes_from_points_task.RoiInfo] = []
        for sample in self._points_dataset:
            for skeleton in sample.annotations:
                if not isinstance(skeleton, dm.Skeleton):
                    continue

                point_label_id = skeleton.label
                original_point_x, original_point_y = skeleton.elements[0].points[:2]
                original_point_x = int(original_point_x)
                original_point_y = int(original_point_y)

                image_h, image_w = sample.image.size

                roi_est_w, roi_est_h = self._roi_size_estimations[point_label_id]
                roi_est_w *= image_w
                roi_est_h *= image_h
                roi_est_w = max(roi_est_w, self.min_roi_size[0])
                roi_est_h = max(roi_est_h, self.min_roi_size[1])

                roi_left = max(0, original_point_x - int(roi_est_w / 2))
                roi_top = max(0, original_point_y - int(roi_est_h / 2))
                roi_right = min(image_w, original_point_x + ceil(roi_est_w / 2))
                roi_bottom = min(image_h, original_point_y + ceil(roi_est_h / 2))

                roi_w = roi_right - roi_left
                roi_h = roi_bottom - roi_top

                new_point_x = original_point_x - roi_left
                new_point_y = original_point_y - roi_top

                rois.append(
                    boxes_from_points_task.RoiInfo(
                        point_id=skeleton.id,
                        original_image_key=sample.attributes["id"],
                        point_x=new_point_x,
                        point_y=new_point_y,
                        roi_x=roi_left,
                        roi_y=roi_top,
                        roi_w=roi_w,
                        roi_h=roi_h,
                    )
                )

        self._rois = rois

    def _mangle_filenames(self):
        """
        Mangle filenames in the dataset to make them less recognizable by annotators
        and hide private dataset info
        """
        assert self._rois is not unset

        # TODO: maybe add different names for the same GT images in
        # different jobs to make them even less recognizable
        self._roi_filenames = {
            roi.point_id: str(uuid.uuid4()) + self.roi_file_ext for roi in self._rois
        }

    def _prepare_job_layout(self):
        assert self._rois is not unset
        assert self._bbox_point_mapping is not unset
        assert self._input_gt_dataset is not unset

        # This list can be different from what is selected for validation
        input_gt_filenames = set(sample.media.path for sample in self._input_gt_dataset)
        original_image_id_to_filename = {
            sample.attributes["id"]: sample.media.path for sample in self._points_dataset
        }
        point_id_to_original_image_id = {roi.point_id: roi.original_image_key for roi in self._rois}

        gt_point_ids = set(self._bbox_point_mapping.values())
        self._gt_roi_filenames = [self._roi_filenames[point_id] for point_id in gt_point_ids]
        self._roi_filenames_to_be_annotated = [
            fn
            for point_id, fn in self._roi_filenames.items()
            if point_id not in gt_point_ids
            if original_image_id_to_filename[point_id_to_original_image_id[point_id]]
            not in input_gt_filenames
        ]

    def _prepare_label_configuration(self):
        self._label_configuration = make_cvat_label_configuration(self.manifest)

    def _upload_task_meta(self):
        layout = boxes_from_points_task.TaskMetaLayout()
        serializer = boxes_from_points_task.TaskMetaSerializer()

        file_list = []
        file_list.append((self._input_points_data, layout.POINTS_FILENAME))
        file_list.append(
            (
                serializer.serialize_gt_annotations(self._gt_dataset),
                layout.GT_FILENAME,
            )
        )
        file_list.append(
            (
                serializer.serialize_bbox_point_mapping(self._bbox_point_mapping),
                layout.BBOX_POINT_MAPPING_FILENAME,
            )
        )
        file_list.append((serializer.serialize_roi_info(self._rois), layout.ROI_INFO_FILENAME))
        file_list.append(
            (serializer.serialize_roi_filenames(self._roi_filenames), layout.ROI_FILENAMES_FILENAME)
        )

        storage_client = self._make_cloud_storage_client(self.oracle_data_bucket)
        for file_data, filename in file_list:
            storage_client.create_file(
                compose_data_bucket_filename(self.escrow_address, self.chain_id, filename),
                file_data,
            )

    def _extract_roi(
        self, source_pixels: np.ndarray, roi_info: boxes_from_points_task.RoiInfo
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
            wrapped_roi_pixels[:, :] = self.roi_background_color

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

    def _draw_roi_point(
        self, roi_pixels: np.ndarray, roi_info: boxes_from_points_task.RoiInfo
    ) -> np.ndarray:
        center = (roi_info.point_x, roi_info.point_y)

        roi_r = (roi_info.roi_w**2 + roi_info.roi_h**2) ** 0.5 / 2
        point_size = int(
            min(
                self.max_embedded_point_radius_percent * roi_r,
                max(self.embedded_point_radius, self.min_embedded_point_radius_percent * roi_r),
            )
        )

        roi_pixels = roi_pixels.copy()
        roi_pixels = cv2.circle(
            roi_pixels,
            center,
            point_size + 1,
            (255, 255, 255),
            cv2.FILLED,
        )
        return cv2.circle(
            roi_pixels,
            center,
            point_size,
            self.embedded_point_color,
            cv2.FILLED,
        )

    def _extract_and_upload_rois(self):
        assert self._points_dataset is not unset
        assert self._rois is not unset
        assert self._data_filenames is not unset
        assert self._roi_filenames is not unset

        src_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
        src_prefix = src_bucket.path
        dst_bucket = self.oracle_data_bucket

        src_client = self._make_cloud_storage_client(src_bucket)
        dst_client = self._make_cloud_storage_client(dst_bucket)

        image_id_to_filename = {
            sample.attributes["id"]: sample.image.path for sample in self._points_dataset
        }

        filename_to_sample = {sample.image.path: sample for sample in self._points_dataset}

        def _roi_key(e):
            return e.original_image_key

        rois_by_image: dict[str, Sequence[boxes_from_points_task.RoiInfo]] = {
            image_id_to_filename[image_id]: list(g)
            for image_id, g in groupby(sorted(self._rois, key=_roi_key), key=_roi_key)
        }

        def process_file(filename: str, image_pixels: np.ndarray):
            image_roi_infos = rois_by_image.get(filename, [])
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

            image_rois = {}
            for roi_info in image_roi_infos:
                roi_pixels = self._extract_roi(image_pixels, roi_info)

                if self.embed_point_in_roi_image:
                    roi_pixels = self._draw_roi_point(roi_pixels, roi_info)

                roi_filename = self._roi_filenames[roi_info.point_id]
                roi_bytes = encode_image(roi_pixels, os.path.splitext(roi_filename)[-1])

                image_rois[roi_filename] = roi_bytes

            for roi_filename, roi_bytes in image_rois.items():
                dst_client.create_file(
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, roi_filename),
                    roi_bytes,
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
                image_roi_infos = rois_by_image.get(filename, [])
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

    def _prepare_gt_roi_dataset(self):
        self._gt_roi_dataset = dm.Dataset(
            categories=self._gt_dataset.categories(), media_type=dm.Image
        )

        roi_info_by_point_id: dict[int, skeletons_from_boxes_task.RoiInfo] = {
            roi_info.point_id: roi_info for roi_info in self._rois
        }

        for sample in self._gt_dataset:
            for gt_bbox in sample.annotations:
                assert isinstance(gt_bbox, dm.Bbox)

                point_id = self._bbox_point_mapping[gt_bbox.id]
                gt_roi_filename = compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, self._roi_filenames[point_id]
                )

                # update gt bbox coordinates to match RoI shift
                roi_info = roi_info_by_point_id[point_id]
                new_x = gt_bbox.points[0] - roi_info.roi_x
                new_y = gt_bbox.points[1] - roi_info.roi_y

                self._gt_roi_dataset.put(
                    sample.wrap(
                        id=os.path.splitext(gt_roi_filename)[0],
                        annotations=[gt_bbox.wrap(x=new_x, y=new_y)],
                        media=dm.Image(path=gt_roi_filename, size=sample.media_as(dm.Image).size),
                        attributes=filter_dict(sample.attributes, exclude_keys=["id"]),
                    )
                )

        assert len(self._gt_roi_dataset) == len(self._gt_roi_filenames)

    def _create_on_cvat(self):
        assert self._roi_filenames_to_be_annotated is not unset
        assert self._gt_roi_filenames is not unset
        assert self._label_configuration is not unset
        assert self._gt_roi_dataset is not unset

        oracle_bucket = self.oracle_data_bucket

        # Register cloud storage on CVAT to pass user dataset
        cvat_cloud_storage = cvat_api.create_cloudstorage(
            **make_cvat_cloud_storage_params(oracle_bucket)
        )

        # Create a project
        cvat_project = cvat_api.create_project(
            self.escrow_address,
            labels=self._label_configuration,
            user_guide=self.manifest.annotation.user_guide,
        )

        # Setup webhooks for the project
        cvat_webhook = cvat_api.create_cvat_webhook(cvat_project.id)

        with SessionLocal.begin() as session:
            segment_size = self._task_segment_size
            total_jobs = math.ceil(len(self._roi_filenames_to_be_annotated) / segment_size)
            self.logger.info(
                "Task creation for escrow '%s': will create %s assignments",
                self.escrow_address,
                total_jobs,
            )
            db_service.create_escrow_creation(
                session,
                escrow_address=self.escrow_address,
                chain_id=self.chain_id,
                total_jobs=total_jobs,
            )

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
            db_service.get_project_by_id(session, project_id, for_update=True)  # lock the row
            db_service.add_project_images(
                session,
                cvat_project.id,
                [
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, fn)
                    for fn in self._roi_filenames.values()
                ],
            )

            for data_subset in self._split_dataset_per_task(
                self._roi_filenames_to_be_annotated,
                subset_size=Config.cvat_config.max_jobs_per_task * segment_size,
            ):
                cvat_task = cvat_api.create_task(
                    cvat_project.id, self.escrow_address, segment_size=segment_size
                )

                task_id = db_service.create_task(
                    session, cvat_task.id, cvat_project.id, TaskStatuses[cvat_task.status]
                )
                db_service.get_task_by_id(session, task_id, for_update=True)  # lock the row

                filenames = [
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, fn)
                    for fn in data_subset
                ]
                gt_filenames = [
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, fn)
                    for fn in self._gt_roi_filenames
                ]

                cvat_api.put_task_data(
                    cvat_task.id,
                    cvat_cloud_storage.id,
                    filenames=filenames,
                    validation_params={
                        "gt_filenames": gt_filenames,
                        "gt_frames_per_job_count": self._job_val_frames_count,
                    },
                )

                self._setup_gt_job_for_cvat_task(
                    cvat_task.id, self._gt_roi_dataset, dm_export_format="coco"
                )
                self._setup_quality_settings(cvat_task.id)

                db_service.create_data_upload(session, cvat_task.id)

            db_service.touch(session, Project, [project_id])

    def build(self):
        self._download_input_data()
        self._parse_gt()
        self._parse_points()
        self._validate_gt()
        self._validate_points()

        # Task configuration creation
        self._prepare_gt()
        self._estimate_roi_sizes()
        self._prepare_roi_info()
        self._mangle_filenames()
        self._prepare_label_configuration()
        self._prepare_job_layout()
        self._prepare_gt_roi_dataset()

        # Data preparation
        self._extract_and_upload_rois()
        self._upload_task_meta()

        self._create_on_cvat()
