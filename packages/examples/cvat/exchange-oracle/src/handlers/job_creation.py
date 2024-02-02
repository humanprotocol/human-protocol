from __future__ import annotations

import os
import random
import uuid
from contextlib import ExitStack
from dataclasses import dataclass
from itertools import groupby, product
from logging import Logger
from math import ceil
from tempfile import TemporaryDirectory
from typing import Dict, List, Sequence, Tuple, TypeVar, Union, cast

import cv2
import datumaro as dm
import numpy as np
from datumaro.util import take_by
from datumaro.util.annotation_util import BboxCoords, bbox_iou
from datumaro.util.image import IMAGE_EXTENSIONS, decode_image, encode_image

import src.core.tasks.boxes_from_points as boxes_from_points_task
import src.core.tasks.skeletons_from_boxes as skeletons_from_boxes_task
import src.cvat.api_calls as cvat_api
import src.services.cloud as cloud_service
import src.services.cvat as db_service
from src.chain.escrow import get_escrow_manifest
from src.core.config import Config
from src.core.manifest import TaskManifest
from src.core.storage import compose_data_bucket_filename
from src.core.types import CvatLabelType, TaskStatus, TaskType
from src.db import SessionLocal
from src.log import ROOT_LOGGER_NAME
from src.services.cloud import CloudProviders, StorageClient
from src.services.cloud.utils import BucketAccessInfo, compose_bucket_url, parse_bucket_url
from src.utils.assignments import parse_manifest
from src.utils.logging import NullLogger, get_function_logger

module_logger = f"{ROOT_LOGGER_NAME}.cron.cvat"

LABEL_TYPE_MAPPING = {
    TaskType.image_label_binary: CvatLabelType.tag,
    TaskType.image_points: CvatLabelType.points,
    TaskType.image_boxes: CvatLabelType.rectangle,
    TaskType.image_boxes_from_points: CvatLabelType.rectangle,
    TaskType.image_skeletons_from_boxes: CvatLabelType.points,
}

DM_DATASET_FORMAT_MAPPING = {
    TaskType.image_label_binary: "cvat_images",
    TaskType.image_points: "coco_person_keypoints",
    TaskType.image_boxes: "coco_instances",
    TaskType.image_boxes_from_points: "coco_instances",
    TaskType.image_skeletons_from_boxes: "coco_person_keypoints",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    # GT uses the same format both for boxes and points
    TaskType.image_label_binary: "cvat_images",
    TaskType.image_points: "coco_instances",
    TaskType.image_boxes: "coco_instances",
    TaskType.image_boxes_from_points: "coco_instances",
    TaskType.image_skeletons_from_boxes: "coco_person_keypoints",
}

CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER = {
    CloudProviders.aws: "AWS_S3_BUCKET",
    CloudProviders.gcs: "GOOGLE_CLOUD_STORAGE",
}


class DatasetValidationError(Exception):
    pass


class MismatchingAnnotations(DatasetValidationError):
    pass


class TooFewSamples(DatasetValidationError):
    pass


class InvalidCategories(DatasetValidationError):
    pass


class InvalidImageInfo(DatasetValidationError):
    pass


T = TypeVar("T")


class _Undefined:
    def __bool__(self) -> bool:
        return False


_unset = _Undefined()

_MaybeUnset = Union[T, _Undefined]


class BoxesFromPointsTaskBuilder:
    def __init__(self, manifest: TaskManifest, escrow_address: str, chain_id: int):
        self.exit_stack = ExitStack()
        self.manifest = manifest
        self.escrow_address = escrow_address
        self.chain_id = chain_id

        self.logger: Logger = NullLogger()

        self.input_gt_data: _MaybeUnset[bytes] = _unset
        self.input_points_data: _MaybeUnset[bytes] = _unset

        # Computed values
        self.input_filenames: _MaybeUnset[Sequence[str]] = _unset
        self.input_gt_dataset: _MaybeUnset[dm.Dataset] = _unset
        self.input_points_dataset: _MaybeUnset[dm.Dataset] = _unset

        self.gt_dataset: _MaybeUnset[dm.Dataset] = _unset

        self.bbox_point_mapping: _MaybeUnset[boxes_from_points_task.BboxPointMapping] = _unset
        "bbox_id -> point_id"

        self.roi_size_estimations: _MaybeUnset[Dict[int, Tuple[float, float]]] = _unset
        "label_id -> (rel. w, rel. h)"

        self.rois: _MaybeUnset[boxes_from_points_task.RoiInfos] = _unset
        self.roi_filenames: _MaybeUnset[boxes_from_points_task.RoiFilenames] = _unset

        self.job_layout: _MaybeUnset[Sequence[Sequence[str]]] = _unset
        "File lists per CVAT job"

        self.label_configuration: _MaybeUnset[Sequence[dict]] = _unset

        # Configuration / constants
        # TODO: consider WebP if produced files are too big
        self.roi_file_ext = ".png"  # supposed to be lossless and reasonably compressing
        "File extension for RoI images, with leading dot (.) included"

        self.sample_error_display_threshold = 5
        "The maximum number of rendered list items in a message"

        self.roi_size_mult = 1.1
        "Additional point ROI size multiplier"

        self.points_format = "coco_person_keypoints"

        self.embed_point_in_roi_image = True
        "Put a small point into the extracted RoI images for the original point"

        self.embedded_point_radius = 15
        self.min_embedded_point_radius_percent = 0.005
        self.max_embedded_point_radius_percent = 0.01
        self.embedded_point_color = (0, 255, 255)

        self.oracle_data_bucket = BucketAccessInfo.from_raw_url(Config.storage_config.bucket_url())
        # TODO: add
        # credentials=BucketCredentials()
        "Exchange Oracle's private bucket info"

        self.min_class_samples_for_roi_estimation = 50

        self.max_discarded_threshold = 0.5
        """
        The maximum allowed percent of discarded
        GT boxes, points, or samples for successful job launch
        """

    def __enter__(self):
        return self

    def __exit__(self, *args, **kwargs):
        self.close()

    def close(self):
        self.exit_stack.close()

    def set_logger(self, logger: Logger):
        # TODO: add escrow info into messages
        self.logger = logger
        return self

    def _download_input_data(self):
        data_bucket = BucketAccessInfo.from_raw_url(self.manifest.data.data_url)
        gt_bucket = BucketAccessInfo.from_raw_url(self.manifest.validation.gt_url)
        points_bucket = BucketAccessInfo.from_raw_url(self.manifest.data.points_url)

        data_storage_client = self._make_cloud_storage_client(data_bucket)
        gt_storage_client = self._make_cloud_storage_client(gt_bucket)
        points_storage_client = self._make_cloud_storage_client(points_bucket)

        data_filenames = data_storage_client.list_filenames(
            data_bucket.url.bucket_name,
            prefix=data_bucket.url.path,
        )
        self.input_filenames = filter_image_files(data_filenames)

        self.input_gt_data = gt_storage_client.download_file(
            gt_bucket.url.bucket_name,
            gt_bucket.url.path,
        )

        self.input_points_data = points_storage_client.download_file(
            points_bucket.url.bucket_name,
            points_bucket.url.path,
        )

    def _parse_dataset(self, annotation_file_data: bytes, dataset_format: str) -> dm.Dataset:
        temp_dir = self.exit_stack.enter_context(TemporaryDirectory())

        annotation_filename = os.path.join(temp_dir, "annotations.json")
        with open(annotation_filename, "wb") as f:
            f.write(annotation_file_data)

        return dm.Dataset.import_from(annotation_filename, format=dataset_format)

    def _parse_gt(self):
        assert self.input_gt_data is not _unset

        self.input_gt_dataset = self._parse_dataset(
            self.input_gt_data,
            dataset_format=DM_GT_DATASET_FORMAT_MAPPING[self.manifest.annotation.type],
        )

    def _parse_points(self):
        assert self.input_points_data is not _unset

        self.input_points_dataset = self._parse_dataset(
            self.input_points_data, dataset_format=self.points_format
        )

    def _validate_gt_labels(self):
        gt_labels = set(
            label.name
            for label in self.input_gt_dataset.categories()[dm.AnnotationType.label]
            if not label.parent
        )
        manifest_labels = set(label.name for label in self.manifest.annotation.labels)
        if gt_labels - manifest_labels:
            raise DatasetValidationError(
                "GT labels do not match job labels. Unknown labels: {}".format(
                    self._format_list(gt_labels - manifest_labels),
                )
            )

        self.input_gt_dataset.transform(
            "project_labels", dst_labels=[label.name for label in self.manifest.annotation.labels]
        )
        self.input_gt_dataset.init_cache()

    def _validate_gt_filenames(self):
        gt_filenames = set(s.id + s.media.ext for s in self.input_gt_dataset)

        known_data_filenames = set(self.input_filenames)
        matched_gt_filenames = gt_filenames.intersection(known_data_filenames)

        if len(gt_filenames) != len(matched_gt_filenames):
            extra_gt = list(map(os.path.basename, gt_filenames - matched_gt_filenames))

            raise MismatchingAnnotations(
                "Failed to find several validation samples in the dataset files: {}".format(
                    self._format_list(extra_gt)
                )
            )

        if len(gt_filenames) < self.manifest.validation.val_size:
            raise TooFewSamples(
                f"Too few validation samples provided ({len(gt_filenames)}), "
                f"at least {self.manifest.validation.val_size} required."
            )

    def _validate_gt(self):
        assert self.input_filenames is not _unset
        assert self.input_gt_dataset is not _unset

        self._validate_gt_filenames()
        self._validate_gt_labels()
        # TODO: add gt annotation validation, keep track of excluded annotations

    def _format_list(
        self, items: Sequence[str], *, max_items: int = None, separator: str = ", "
    ) -> str:
        if max_items is None:
            max_items = self.sample_error_display_threshold

        remainder_count = len(items) - max_items
        return "{}{}".format(
            separator.join(items[:max_items]),
            f"(and {remainder_count} more)" if remainder_count > 0 else "",
        )

    def _validate_points_categories(self):
        invalid_point_categories_messages = []
        points_dataset_categories = self.input_points_dataset.categories()
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
                    self._format_list(invalid_point_categories_messages, separator="; ")
                )
            )

        points_labels = set(label.name for label in points_dataset_label_cat if not label.parent)
        manifest_labels = set(label.name for label in self.manifest.annotation.labels)
        if manifest_labels != points_labels:
            raise DatasetValidationError("Point labels do not match job labels")

        self.input_points_dataset.transform(
            "project_labels", dst_labels=[label.name for label in self.manifest.annotation.labels]
        )
        self.input_points_dataset.init_cache()

    def _validate_points_filenames(self):
        points_filenames = set(sample.id + sample.media.ext for sample in self.input_points_dataset)

        known_data_filenames = set(self.input_filenames)
        matched_points_filenames = points_filenames.intersection(known_data_filenames)

        if len(known_data_filenames) != len(matched_points_filenames):
            missing_point_samples = list(
                map(os.path.basename, known_data_filenames - matched_points_filenames)
            )
            extra_point_samples = list(
                map(os.path.basename, points_filenames - matched_points_filenames)
            )

            raise MismatchingAnnotations(
                "Mismatching points info and input files: {}".format(
                    "; ".join(
                        "{} missing points".format(self._format_list(missing_point_samples)),
                        "{} extra points".format(self._format_list(extra_point_samples)),
                    )
                )
            )

    def _validate_points_annotations(self):
        label_cat: dm.LabelCategories = self.input_points_dataset.categories()[
            dm.AnnotationType.label
        ]

        excluded_samples = []
        for sample in self.input_points_dataset:
            # Could fail on this as well
            image_h, image_w = sample.image.size

            for skeleton in sample.annotations:
                # Could fail on this as well
                if not isinstance(skeleton, dm.Skeleton):
                    continue

                if len(skeleton.elements) != 1:
                    message = (
                        "Sample '{}': skeleton #{} ({}) skipped - "
                        "invalid points count ({}), expected 1".format(
                            sample.id,
                            skeleton.id,
                            label_cat[skeleton.label].name,
                            len(skeleton.elements),
                        )
                    )
                    excluded_samples.append(((sample.id, sample.subset), message))
                    break

                point = skeleton.elements[0]
                px, py = point.points[:2]

                if px < 0 or py < 0 or px > image_w or py > image_h:
                    message = (
                        "Sample '{}': point #{} ({}) skipped - "
                        "coordinates are outside image".format(
                            sample.id, skeleton.id, label_cat[skeleton.label].name
                        )
                    )
                    excluded_samples.append(((sample.id, sample.subset), message))

        if len(excluded_samples) > len(self.input_points_dataset) * self.max_discarded_threshold:
            raise DatasetValidationError(
                "Too many samples discarded, canceling job creation. Errors: {}".format(
                    self._format_list([message for _, message in excluded_samples])
                )
            )

        for excluded_sample, _ in excluded_samples:
            self.input_points_dataset.remove(*excluded_sample)

        if excluded_samples:
            self.logger.warning(
                "Some samples were excluded due to errors found: {}".format(
                    self._format_list([m for _, m in excluded_samples], separator="\n")
                )
            )

    def _validate_points(self):
        assert self.input_filenames is not _unset
        assert self.input_points_dataset is not _unset

        self._validate_points_categories()
        self._validate_points_filenames()
        self._validate_points_annotations()

    @staticmethod
    def _is_point_in_bbox(px: float, py: float, bbox: dm.Bbox) -> bool:
        return (bbox.x <= px <= bbox.x + bbox.w) and (bbox.y <= py <= bbox.y + bbox.h)

    def _prepare_gt(self):
        assert self.input_filenames is not _unset
        assert self.input_points_dataset is not _unset
        assert self.input_gt_dataset is not _unset
        assert [
            label.name for label in self.input_gt_dataset.categories()[dm.AnnotationType.label]
        ] == [label.name for label in self.manifest.annotation.labels]
        assert [
            label.name
            for label in self.input_points_dataset.categories()[dm.AnnotationType.label]
            if not label.parent
        ] == [label.name for label in self.manifest.annotation.labels]

        gt_dataset = dm.Dataset(categories=self.input_gt_dataset.categories(), media_type=dm.Image)

        gt_label_cat: dm.LabelCategories = self.input_gt_dataset.categories()[
            dm.AnnotationType.label
        ]

        excluded_boxes_messages = []
        total_boxes = 0
        gt_count_per_class = {}

        bbox_point_mapping = {}  # bbox id -> point id
        for gt_sample in self.input_gt_dataset:
            points_sample = self.input_points_dataset.get(gt_sample.id, gt_sample.subset)
            assert points_sample

            image_h, image_w = points_sample.image.size

            gt_boxes = [a for a in gt_sample.annotations if isinstance(a, dm.Bbox)]
            input_skeletons = [a for a in points_sample.annotations if isinstance(a, dm.Skeleton)]

            # Samples without boxes are allowed, so we just skip them without an error
            if not gt_boxes:
                continue

            total_boxes += len(gt_boxes)

            matched_boxes = []
            visited_skeletons = set()
            for gt_bbox in gt_boxes:
                gt_bbox_id = gt_bbox.id

                if (
                    gt_bbox.x < 0
                    or gt_bbox.y < 0
                    or gt_bbox.x + gt_bbox.w > image_w
                    or gt_bbox.y + gt_bbox.h > image_h
                ):
                    excluded_boxes_messages.append(
                        "Sample '{}': GT bbox #{} ({}) - "
                        "coordinates are outside image. The image will be skipped".format(
                            gt_sample.id, gt_bbox_id, gt_label_cat[gt_bbox.label].name
                        )
                    )
                    matched_boxes = []
                    break

                if len(visited_skeletons) == len(gt_boxes):
                    # Handle unmatched boxes
                    excluded_boxes_messages.append(
                        "Sample '{}': GT bbox #{} ({}) skipped - "
                        "no matching points found".format(
                            gt_sample.id, gt_bbox_id, gt_label_cat[gt_bbox.label].name
                        )
                    )
                    continue

                matched_skeletons: List[dm.Skeleton] = []
                for input_skeleton in input_skeletons:
                    skeleton_id = input_skeleton.id
                    if skeleton_id in visited_skeletons:
                        continue

                    input_point = input_skeleton.elements[0]
                    if not self._is_point_in_bbox(*input_point.points[0:2], bbox=gt_bbox):
                        continue

                    if input_skeleton.label != gt_bbox.label:
                        continue

                    matched_skeletons.append(input_skeleton)
                    visited_skeletons.add(skeleton_id)

                if len(matched_skeletons) > 1:
                    # Handle ambiguous matches
                    excluded_boxes_messages.append(
                        "Sample '{}': GT bbox #{} ({}) skipped - "
                        "too many matching points ({}) found".format(
                            gt_sample.id,
                            gt_bbox_id,
                            gt_label_cat[gt_bbox.label].name,
                            len(matched_skeletons),
                        )
                    )
                    continue
                elif len(matched_skeletons) == 0:
                    # Handle unmatched boxes
                    excluded_boxes_messages.append(
                        "Sample '{}': GT bbox #{} ({}) skipped - "
                        "no matching points found".format(
                            gt_sample.id,
                            gt_bbox_id,
                            gt_label_cat[gt_bbox.label].name,
                        )
                    )
                    continue

                gt_count_per_class[gt_bbox.label] = gt_count_per_class.get(gt_bbox.label, 0) + 1

                matched_boxes.append(gt_bbox)
                bbox_point_mapping[gt_bbox_id] = matched_skeletons[0].id

            if not matched_boxes:
                continue

            gt_dataset.put(gt_sample.wrap(annotations=matched_boxes))

        if len(bbox_point_mapping) < (1 - self.max_discarded_threshold) * total_boxes:
            raise DatasetValidationError(
                "Too many GT boxes discarded ({} out of {}). "
                "Please make sure each GT box matches exactly 1 point".format(
                    total_boxes - len(bbox_point_mapping), total_boxes
                )
            )
        elif excluded_boxes_messages:
            self.logger.warning(self._format_list(excluded_boxes_messages, separator="\n"))

        gt_labels_without_anns = [
            gt_label_cat[label_id]
            for label_id, label_count in gt_count_per_class.items()
            if not label_count
        ]
        if gt_labels_without_anns:
            raise DatasetValidationError(
                "No matching GT boxes/points annotations found for some classes: {}".format(
                    self._format_list(gt_labels_without_anns)
                )
            )

        self.gt_dataset = gt_dataset
        self.bbox_point_mapping = bbox_point_mapping

    def _estimate_roi_sizes(self):
        assert self.gt_dataset is not _unset
        assert [label.name for label in self.gt_dataset.categories()[dm.AnnotationType.label]] == [
            label.name for label in self.manifest.annotation.labels
        ]

        bbox_sizes_per_label = {}
        for sample in self.gt_dataset:
            image_h, image_w = self.input_points_dataset.get(sample.id, sample.subset).image.size

            for gt_bbox in sample.annotations:
                gt_bbox = cast(dm.Bbox, gt_bbox)
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
        classes_with_default_roi = []
        roi_size_estimations_per_label = {}  # label id -> (w, h)
        for label_id, label_sizes in bbox_sizes_per_label.items():
            if len(label_sizes) < self.min_class_samples_for_roi_estimation:
                classes_with_default_roi.append(label_id)
                estimated_size = (2, 2)  # 2 will yield just the image size after halving
            else:
                max_bbox = np.max(label_sizes, axis=0)
                estimated_size = max_bbox * self.roi_size_mult

            roi_size_estimations_per_label[label_id] = estimated_size

        if classes_with_default_roi:
            label_cat = self.gt_dataset.categories()[dm.AnnotationType.label]
            self.logger.warning(
                "Some classes will use the full image instead of RoI"
                "- too few GT provided: {}".format(
                    self._format_list(
                        [label_cat[label_id].name for label_id in classes_with_default_roi]
                    )
                )
            )

        self.roi_size_estimations = roi_size_estimations_per_label

    def _prepare_roi_info(self):
        assert self.gt_dataset is not _unset
        assert self.roi_size_estimations is not _unset
        assert self.input_points_dataset is not _unset

        rois: List[boxes_from_points_task.RoiInfo] = []
        for sample in self.input_points_dataset:
            for skeleton in sample.annotations:
                if not isinstance(skeleton, dm.Skeleton):
                    continue

                point_label_id = skeleton.label
                original_point_x, original_point_y = skeleton.elements[0].points[:2]
                original_point_x = int(original_point_x)
                original_point_y = int(original_point_y)

                image_h, image_w = sample.image.size

                roi_est_w, roi_est_h = self.roi_size_estimations[point_label_id]
                roi_est_w *= image_w
                roi_est_h *= image_h

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

        self.rois = rois

    def _mangle_filenames(self):
        """
        Mangle filenames in the dataset to make them less recognizable by annotators
        and hide private dataset info
        """
        assert self.rois is not _unset

        # TODO: maybe add different names for the same GT images in
        # different jobs to make them even less recognizable
        self.roi_filenames = {
            roi.point_id: str(uuid.uuid4()) + self.roi_file_ext for roi in self.rois
        }

    def _prepare_job_layout(self):
        # Make job layouts wrt. manifest params
        # 1 job per task as CVAT can't repeat images in jobs, but GTs can repeat in the dataset

        assert self.rois is not _unset
        assert self.bbox_point_mapping is not _unset

        gt_point_ids = set(self.bbox_point_mapping.values())
        gt_filenames = [self.roi_filenames[point_id] for point_id in gt_point_ids]

        data_filenames = [
            fn for point_id, fn in self.roi_filenames.items() if not point_id in gt_point_ids
        ]
        random.shuffle(data_filenames)

        job_layout = []
        for data_samples in take_by(data_filenames, self.manifest.annotation.job_size):
            gt_samples = random.sample(gt_filenames, k=self.manifest.validation.val_size)
            job_samples = list(data_samples) + list(gt_samples)
            random.shuffle(job_samples)
            job_layout.append(job_samples)

        self.job_layout = job_layout

    def _prepare_label_configuration(self):
        self.label_configuration = make_label_configuration(self.manifest)

    def _upload_task_meta(self):
        layout = boxes_from_points_task.TaskMetaLayout()
        serializer = boxes_from_points_task.TaskMetaSerializer()

        file_list = []
        file_list.append((self.input_points_data, layout.POINTS_FILENAME))
        file_list.append(
            (
                serializer.serialize_gt_annotations(self.gt_dataset),
                layout.GT_FILENAME,
            )
        )
        file_list.append(
            (
                serializer.serialize_bbox_point_mapping(self.bbox_point_mapping),
                layout.BBOX_POINT_MAPPING_FILENAME,
            )
        )
        file_list.append((serializer.serialize_roi_info(self.rois), layout.ROI_INFO_FILENAME))
        file_list.append(
            (serializer.serialize_roi_filenames(self.roi_filenames), layout.ROI_FILENAMES_FILENAME)
        )

        storage_client = self._make_cloud_storage_client(self.oracle_data_bucket)
        bucket_name = self.oracle_data_bucket.url.bucket_name
        for file_data, filename in file_list:
            storage_client.create_file(
                bucket_name,
                compose_data_bucket_filename(self.escrow_address, self.chain_id, filename),
                file_data,
            )

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
        roi_pixels = cv2.circle(
            roi_pixels,
            center,
            point_size,
            self.embedded_point_color,
            cv2.FILLED,
        )

        return roi_pixels

    def _extract_and_upload_rois(self):
        # TODO: maybe optimize via splitting into separate threads (downloading, uploading, processing)
        # Watch for the memory used, as the whole dataset can be quite big (gigabytes, terabytes)
        # Consider also packing RoIs cut into archives
        assert self.input_points_dataset is not _unset
        assert self.rois is not _unset
        assert self.input_filenames is not _unset
        assert self.roi_filenames is not _unset

        src_bucket = BucketAccessInfo.from_raw_url(self.manifest.data.data_url)
        src_prefix = ""
        dst_bucket = self.oracle_data_bucket

        src_client = self._make_cloud_storage_client(src_bucket)
        dst_client = self._make_cloud_storage_client(dst_bucket)

        image_id_to_filename = {
            sample.attributes["id"]: sample.image.path for sample in self.input_points_dataset
        }

        filename_to_sample = {sample.image.path: sample for sample in self.input_points_dataset}

        _roi_key = lambda e: e.original_image_key
        rois_by_image: Dict[str, Sequence[boxes_from_points_task.RoiInfo]] = {
            image_id_to_filename[image_id]: list(g)
            for image_id, g in groupby(sorted(self.rois, key=_roi_key), key=_roi_key)
        }

        for filename in self.input_filenames:
            image_roi_infos = rois_by_image.get(filename, [])
            if not image_roi_infos:
                continue

            image_bytes = src_client.download_file(
                src_bucket.url.bucket_name, os.path.join(src_prefix, filename)
            )
            image_pixels = decode_image(image_bytes)

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
                roi_pixels = image_pixels[
                    roi_info.roi_y : roi_info.roi_y + roi_info.roi_h,
                    roi_info.roi_x : roi_info.roi_x + roi_info.roi_w,
                ]

                if self.embed_point_in_roi_image:
                    roi_pixels = self._draw_roi_point(roi_pixels, roi_info)

                roi_filename = self.roi_filenames[roi_info.point_id]
                roi_bytes = encode_image(roi_pixels, os.path.splitext(roi_filename)[-1])

                image_rois[roi_filename] = roi_bytes

            for roi_filename, roi_bytes in image_rois.items():
                dst_client.create_file(
                    dst_bucket.url.bucket_name,
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, roi_filename),
                    roi_bytes,
                )

    def _create_on_cvat(self):
        assert self.job_layout is not _unset
        assert self.label_configuration is not _unset

        input_data_bucket = BucketAccessInfo.from_raw_url(self.manifest.data.data_url)
        oracle_bucket = self.oracle_data_bucket

        # Register cloud storage on CVAT to pass user dataset
        cloud_storage = cvat_api.create_cloudstorage(
            CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER[oracle_bucket.provider],
            oracle_bucket.url.host_url,
            oracle_bucket.url.bucket_name,
            # TODO: add
            # credentials=...
        )

        # Create a project
        project = cvat_api.create_project(
            self.escrow_address,
            labels=self.label_configuration,
            user_guide=self.manifest.annotation.user_guide,
        )

        # Setup webhooks for a project (update:task, update:job)
        webhook = cvat_api.create_cvat_webhook(project.id)

        input_data_bucket = parse_bucket_url(self.manifest.data.data_url)
        with SessionLocal.begin() as session:
            db_service.create_project(
                session,
                project.id,
                cloud_storage.id,
                self.manifest.annotation.type,
                self.escrow_address,
                self.chain_id,
                compose_bucket_url(
                    input_data_bucket.bucket_name,
                    bucket_host=input_data_bucket.host_url,
                    provider=input_data_bucket.provider,
                ),
                cvat_webhook_id=webhook.id,
            )
            db_service.add_project_images(
                session,
                project.id,
                [
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, fn)
                    for fn in self.roi_filenames.values()
                ],
            )

        for job_filenames in self.job_layout:
            task = cvat_api.create_task(project.id, self.escrow_address)

            with SessionLocal.begin() as session:
                db_service.create_task(session, task.id, project.id, TaskStatus[task.status])

            # Actual task creation in CVAT takes some time, so it's done in an async process.
            # The task will be created in DB once 'update:task' or 'update:job' webhook is received.
            cvat_api.put_task_data(
                task.id,
                cloud_storage.id,
                filenames=[
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, fn)
                    for fn in job_filenames
                ],
                sort_images=False,
            )

            with SessionLocal.begin() as session:
                db_service.create_data_upload(session, cvat_task_id=task.id)

    @classmethod
    def _make_cloud_storage_client(cls, bucket_info: BucketAccessInfo) -> StorageClient:
        return cloud_service.make_client(bucket_info)

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

        # Data preparation
        self._extract_and_upload_rois()
        self._upload_task_meta()

        self._create_on_cvat()


class SkeletonsFromBoxesTaskBuilder:
    @dataclass
    class _JobParams:
        label_id: int
        roi_ids: List[int]
        tileset_ids: _MaybeUnset[List[int]] = _unset

    @dataclass
    class _TilesetParams:
        roi_ids: List[int]

        all_tile_coords: np.ndarray
        "N x (x, y, w, h)"

        all_roi_coords: np.ndarray
        "N x (x, y, w, h)"

        frame_size: np.ndarray
        "h, w"

        roi_border_size: np.ndarray
        "h, w"

        tile_margin_size: np.ndarray
        "h, w"

    def __init__(self, manifest: TaskManifest, escrow_address: str, chain_id: int):
        self.exit_stack = ExitStack()
        self.manifest = manifest
        self.escrow_address = escrow_address
        self.chain_id = chain_id

        self.logger: Logger = NullLogger()

        self.input_gt_data: _MaybeUnset[bytes] = _unset
        self.input_boxes_data: _MaybeUnset[bytes] = _unset

        # Computed values
        self.input_filenames: _MaybeUnset[Sequence[str]] = _unset
        self.input_gt_dataset: _MaybeUnset[dm.Dataset] = _unset
        self.input_boxes_dataset: _MaybeUnset[dm.Dataset] = _unset

        self.tileset_filenames: _MaybeUnset[Dict[int, str]] = _unset
        self.job_params: _MaybeUnset[List[self._JobParams]] = _unset
        self.gt_dataset: _MaybeUnset[dm.Dataset] = _unset

        # Configuration / constants
        # TODO: consider WebP if produced files are too big
        self.tileset_file_ext = ".png"  # supposed to be lossless and reasonably compressing
        "File extension for tileset images, with leading dot (.) included"

        self.list_display_threshold = 5
        "The maximum number of rendered list items in a message"

        self.roi_size_mult = 1.1
        "Additional point ROI size multiplier"

        self.boxes_format = "coco_instances"

        self.embed_bbox_in_roi_image = True
        "Put a bbox into the extracted skeleton RoI images"

        self.embed_tile_border = True

        self.roi_embedded_bbox_color = (0, 255, 255)  # BGR

        self.tileset_size = (3, 2)  # W, H
        self.tileset_background_color = (245, 240, 242)  # BGR - CVAT background color
        self.tile_border_color = (255, 255, 255)

        self.oracle_data_bucket = BucketAccessInfo.from_raw_url(Config.storage_config.bucket_url())
        # TODO: add
        # credentials=BucketCredentials()
        "Exchange Oracle's private bucket info"

        self.min_label_gt_samples = 2  # TODO: find good threshold

        self.max_discarded_threshold = 0.5
        """
        The maximum allowed percent of discarded
        GT annotations or samples for successful job launch
        """

    def __enter__(self):
        return self

    def __exit__(self, *args, **kwargs):
        self.close()

    def close(self):
        self.exit_stack.close()

    def set_logger(self, logger: Logger):
        # TODO: add escrow info into messages
        self.logger = logger
        return self

    def _download_input_data(self):
        data_bucket = BucketAccessInfo.from_raw_url(self.manifest.data.data_url)
        gt_bucket = BucketAccessInfo.from_raw_url(self.manifest.validation.gt_url)
        boxes_bucket = BucketAccessInfo.from_raw_url(self.manifest.data.boxes_url)

        data_storage_client = self._make_cloud_storage_client(data_bucket)
        gt_storage_client = self._make_cloud_storage_client(gt_bucket)
        boxes_storage_client = self._make_cloud_storage_client(boxes_bucket)

        data_filenames = data_storage_client.list_filenames(
            data_bucket.url.bucket_name,
            prefix=data_bucket.url.path,
        )
        self.input_filenames = filter_image_files(data_filenames)

        self.input_gt_data = gt_storage_client.download_file(
            gt_bucket.url.bucket_name,
            gt_bucket.url.path,
        )

        self.input_boxes_data = boxes_storage_client.download_file(
            boxes_bucket.url.bucket_name,
            boxes_bucket.url.path,
        )

    def _parse_dataset(self, annotation_file_data: bytes, dataset_format: str) -> dm.Dataset:
        temp_dir = self.exit_stack.enter_context(TemporaryDirectory())

        annotation_filename = os.path.join(temp_dir, "annotations.json")
        with open(annotation_filename, "wb") as f:
            f.write(annotation_file_data)

        return dm.Dataset.import_from(annotation_filename, format=dataset_format)

    def _parse_gt(self):
        assert self.input_gt_data is not _unset

        self.input_gt_dataset = self._parse_dataset(
            self.input_gt_data,
            dataset_format=DM_GT_DATASET_FORMAT_MAPPING[self.manifest.annotation.type],
        )

    def _parse_boxes(self):
        assert self.input_boxes_data is not _unset

        self.input_boxes_dataset = self._parse_dataset(
            self.input_boxes_data, dataset_format=self.boxes_format
        )

    def _validate_gt_labels(self):
        gt_labels = set(
            (label.name, label.parent)
            for label in self.input_gt_dataset.categories()[dm.AnnotationType.label]
        )

        manifest_labels = set()
        for skeleton_label in self.manifest.annotation.labels:
            manifest_labels.add((skeleton_label.name, ""))
            for node_label in skeleton_label.nodes:
                manifest_labels.add((node_label, skeleton_label.name))

        if gt_labels - manifest_labels:
            raise DatasetValidationError(
                "GT labels do not match job labels. Unknown labels: {}".format(
                    self._format_list(
                        [
                            label_name if not parent_name else f"{parent_name}.{label_name}"
                            for label_name, parent_name in gt_labels - manifest_labels
                        ]
                    ),
                )
            )

        # Reorder labels to match manifest
        self.input_gt_dataset.transform(
            "project_labels", dst_labels=[label.name for label in self.manifest.annotation.labels]
        )
        self.input_gt_dataset.init_cache()

    def _validate_gt_filenames(self):
        gt_filenames = set(s.id + s.media.ext for s in self.input_gt_dataset)

        known_data_filenames = set(self.input_filenames)
        matched_gt_filenames = gt_filenames.intersection(known_data_filenames)

        if len(gt_filenames) != len(matched_gt_filenames):
            extra_gt = list(map(os.path.basename, gt_filenames - matched_gt_filenames))

            raise MismatchingAnnotations(
                "Failed to find several validation samples in the dataset files: {}".format(
                    self._format_list(extra_gt)
                )
            )

        if len(gt_filenames) < self.manifest.validation.val_size:
            raise TooFewSamples(
                f"Too few validation samples provided ({len(gt_filenames)}), "
                f"at least {self.manifest.validation.val_size} required."
            )

    def _validate_gt(self):
        assert self.input_filenames is not _unset
        assert self.input_gt_dataset is not _unset

        self._validate_gt_filenames()
        self._validate_gt_labels()

        # TODO: check coordinates
        # TODO: check there are matching pairs of bbox/skeleton in GT
        # TODO: pass discarded/total down

    def _validate_boxes_categories(self):
        boxes_dataset_categories = self.input_boxes_dataset.categories()
        boxes_dataset_label_cat: dm.LabelCategories = boxes_dataset_categories[
            dm.AnnotationType.label
        ]

        boxes_labels = set(label.name for label in boxes_dataset_label_cat if not label.parent)
        manifest_labels = set(label.name for label in self.manifest.annotation.labels)
        if manifest_labels != boxes_labels:
            raise DatasetValidationError("Bbox labels do not match job labels")

        # Reorder labels to match manifest
        self.input_boxes_dataset.transform(
            "project_labels", dst_labels=[label.name for label in self.manifest.annotation.labels]
        )
        self.input_boxes_dataset.init_cache()

    def _validate_boxes_filenames(self):
        boxes_filenames = set(sample.id + sample.media.ext for sample in self.input_boxes_dataset)

        known_data_filenames = set(self.input_filenames)
        matched_boxes_filenames = boxes_filenames.intersection(known_data_filenames)

        if len(known_data_filenames) != len(matched_boxes_filenames):
            missing_box_samples = list(
                map(os.path.basename, known_data_filenames - matched_boxes_filenames)
            )
            extra_point_samples = list(
                map(os.path.basename, boxes_filenames - matched_boxes_filenames)
            )

            raise MismatchingAnnotations(
                "Mismatching bbox info and input files: {}".format(
                    "; ".join(
                        "{} missing boxes".format(self._format_list(missing_box_samples)),
                        "{} extra boxes".format(self._format_list(extra_point_samples)),
                    )
                )
            )

    def _validate_boxes_annotations(self):
        label_cat: dm.LabelCategories = self.input_boxes_dataset.categories()[
            dm.AnnotationType.label
        ]

        # TODO: check for excluded boxes count
        excluded_samples = []
        for sample in self.input_boxes_dataset:
            # Could fail on this as well
            image_h, image_w = sample.image.size

            for bbox in sample.annotations:
                # Could fail on this as well
                if not isinstance(bbox, dm.Bbox):
                    continue

                if not (
                    (0 <= bbox.x < bbox.x + bbox.w <= image_w)
                    and (0 <= bbox.y < bbox.y + bbox.h <= image_h)
                ):
                    message = "Sample '{}': bbox #{} ({}) skipped - " "invalid coordinates".format(
                        sample.id, bbox.id, label_cat[bbox.label].name
                    )
                    excluded_samples.append(((sample.id, sample.subset), message))

        if len(excluded_samples) > len(self.input_boxes_dataset) * self.max_discarded_threshold:
            raise DatasetValidationError(
                "Too many samples discarded, canceling job creation. Errors: {}".format(
                    self._format_list([message for _, message in excluded_samples])
                )
            )

        for excluded_sample, _ in excluded_samples:
            self.input_boxes_dataset.remove(*excluded_sample)

        if excluded_samples:
            self.logger.warning(
                "Some samples were excluded due to errors found: {}".format(
                    self._format_list([m for _, m in excluded_samples], separator="\n")
                )
            )

    def _validate_boxes(self):
        assert self.input_filenames is not _unset
        assert self.input_boxes_dataset is not _unset

        self._validate_boxes_categories()
        self._validate_boxes_filenames()
        self._validate_boxes_annotations()

    def _format_list(
        self, items: Sequence[str], *, max_items: int = None, separator: str = ", "
    ) -> str:
        if max_items is None:
            max_items = self.list_display_threshold

        remainder_count = len(items) - max_items
        return "{}{}".format(
            separator.join(items[:max_items]),
            f"(and {remainder_count} more)" if remainder_count > 0 else "",
        )

    def _match_boxes(self, a: BboxCoords, b: BboxCoords):
        return bbox_iou(a, b) > 0

    def _prepare_gt(self):
        assert self.input_filenames is not _unset
        assert self.input_boxes_dataset is not _unset
        assert self.input_gt_dataset is not _unset
        assert [
            label.name
            for label in self.input_gt_dataset.categories()[dm.AnnotationType.label]
            if not label.parent
        ] == [label.name for label in self.manifest.annotation.labels]
        assert [
            label.name
            for label in self.input_boxes_dataset.categories()[dm.AnnotationType.label]
            if not label.parent
        ] == [label.name for label in self.manifest.annotation.labels]

        gt_dataset = dm.Dataset(categories=self.input_gt_dataset.categories(), media_type=dm.Image)

        gt_label_cat: dm.LabelCategories = self.input_gt_dataset.categories()[
            dm.AnnotationType.label
        ]

        excluded_skeletons_messages = []
        total_skeletons = 0
        gt_count_per_class = {}

        skeleton_bbox_mapping = {}  # skeleton id -> bbox id
        for gt_sample in self.input_gt_dataset:
            boxes_sample = self.input_boxes_dataset.get(gt_sample.id, gt_sample.subset)
            # Samples could be discarded, so we just skip them without an error
            if not boxes_sample:
                continue

            gt_skeletons = [a for a in gt_sample.annotations if isinstance(a, dm.Skeleton)]
            input_boxes = [a for a in boxes_sample.annotations if isinstance(a, dm.Bbox)]

            # Samples without boxes are allowed, so we just skip them without an error
            if not gt_skeletons:
                continue

            total_skeletons += len(gt_skeletons)

            # Find unambiguous gt skeleton - input bbox pairs
            matched_skeletons = []
            visited_skeletons = set()
            for gt_skeleton in gt_skeletons:
                gt_skeleton_id = gt_skeleton.id

                if len(visited_skeletons) == len(gt_skeletons):
                    # Handle unmatched boxes
                    excluded_skeletons_messages.append(
                        "Sample '{}': GT skeleton #{} ({}) skipped - "
                        "no matching boxes found".format(
                            gt_sample.id, gt_skeleton_id, gt_label_cat[gt_skeleton.label].name
                        )
                    )
                    continue

                matched_boxes: List[dm.Bbox] = []
                for input_bbox in input_boxes:
                    skeleton_id = input_bbox.id
                    if skeleton_id in visited_skeletons:
                        continue

                    gt_skeleton_bbox = gt_skeleton.get_bbox()
                    if not self._match_boxes(input_bbox.get_bbox(), gt_skeleton_bbox):
                        continue

                    if input_bbox.label != gt_skeleton.label:
                        continue

                    matched_boxes.append(input_bbox)
                    visited_skeletons.add(skeleton_id)

                if len(matched_boxes) > 1:
                    # Handle ambiguous matches
                    excluded_skeletons_messages.append(
                        "Sample '{}': GT skeleton #{} ({}) skipped - "
                        "too many matching boxes ({}) found".format(
                            gt_sample.id,
                            gt_skeleton_id,
                            gt_label_cat[gt_skeleton.label].name,
                            len(matched_boxes),
                        )
                    )
                    continue
                elif len(matched_boxes) == 0:
                    # Handle unmatched boxes
                    excluded_skeletons_messages.append(
                        "Sample '{}': GT skeleton #{} ({}) skipped - "
                        "no matching boxes found".format(
                            gt_sample.id,
                            gt_skeleton_id,
                            gt_label_cat[gt_skeleton.label].name,
                        )
                    )
                    continue

                # TODO: maybe check if the top match is good enough
                # (high thresholds may lead to matching issues for small objects)

                gt_count_per_class[gt_skeleton.label] = (
                    gt_count_per_class.get(gt_skeleton.label, 0) + 1
                )

                matched_skeletons.append(gt_skeleton)
                skeleton_bbox_mapping[gt_skeleton_id] = matched_boxes[0].id

            if not matched_skeletons:
                continue

            gt_dataset.put(gt_sample.wrap(annotations=matched_skeletons))

        if len(skeleton_bbox_mapping) < (1 - self.max_discarded_threshold) * total_skeletons:
            raise DatasetValidationError(
                "Too many GT skeletons discarded ({} out of {}). "
                "Please make sure each GT skeleton matches exactly 1 bbox".format(
                    total_skeletons - len(skeleton_bbox_mapping), total_skeletons
                )
            )
        elif excluded_skeletons_messages:
            self.logger.warning(self._format_list(excluded_skeletons_messages, separator="\n"))

        labels_with_few_gt = [
            gt_label_cat[label_id]
            for label_id, label_count in gt_count_per_class.items()
            if label_count < self.min_label_gt_samples
        ]
        if labels_with_few_gt:
            raise DatasetValidationError(
                "Too few matching GT boxes/points annotations found for some classes: {}".format(
                    self._format_list(labels_with_few_gt)
                )
            )

        self.gt_dataset = gt_dataset
        self.skeleton_bbox_mapping = skeleton_bbox_mapping

    def _prepare_roi_infos(self):
        assert self.gt_dataset is not _unset
        assert self.input_boxes_dataset is not _unset

        rois: List[skeletons_from_boxes_task.RoiInfo] = []
        for sample in self.input_boxes_dataset:
            for bbox in sample.annotations:
                if not isinstance(bbox, dm.Bbox):
                    continue

                original_bbox_x = int(bbox.x)
                original_bbox_y = int(bbox.y)

                image_h, image_w = sample.image.size

                roi_margin_w = bbox.w * self.roi_size_mult
                roi_margin_h = bbox.h * self.roi_size_mult

                roi_left = max(0, original_bbox_x - int(roi_margin_w / 2))
                roi_top = max(0, original_bbox_y - int(roi_margin_h / 2))
                roi_right = min(image_w, original_bbox_x + ceil(roi_margin_w / 2))
                roi_bottom = min(image_h, original_bbox_y + ceil(roi_margin_h / 2))

                roi_w = roi_right - roi_left
                roi_h = roi_bottom - roi_top

                new_bbox_x = original_bbox_x - roi_left
                new_bbox_y = original_bbox_y - roi_top

                rois.append(
                    skeletons_from_boxes_task.RoiInfo(
                        original_image_key=sample.attributes["id"],
                        bbox_id=bbox.id,
                        bbox_label=bbox.label,
                        bbox_x=new_bbox_x,
                        bbox_y=new_bbox_y,
                        roi_x=roi_left,
                        roi_y=roi_top,
                        roi_w=roi_w,
                        roi_h=roi_h,
                    )
                )

        self.roi_infos = rois

    def _prepare_dataset_tileset_params(self):
        assert self.gt_dataset is not _unset
        assert self.input_boxes_dataset is not _unset
        assert self.roi_infos is not _unset
        assert self.job_params is not _unset

        combined_tileset_params: Dict[int, self._TilesetParams] = {}
        self.tileset_params = combined_tileset_params
        roi_info_by_id = {roi_info.bbox_id: roi_info for roi_info in self.roi_infos}

        for job_params in self.job_params:
            assert job_params.tileset_ids is _unset
            tileset_ids = []
            for tileset_roi_ids in take_by(job_params.roi_ids, np.prod(self.tileset_size)):
                tileset_id = len(combined_tileset_params)
                combined_tileset_params[tileset_id] = self._prepare_tileset_params(
                    [roi_info_by_id[roi_id] for roi_id in tileset_roi_ids],
                    grid_size=self.tileset_size,
                )
                tileset_ids.append(tileset_id)

            job_params.tileset_ids = tileset_ids

        self.tileset_params = combined_tileset_params

    @classmethod
    def _prepare_tileset_params(
        cls,
        rois: skeletons_from_boxes_task.RoiInfos,
        *,
        grid_size: Tuple[int, int],
    ) -> _TilesetParams:
        """
        RoI is inside tile, centered
        border is for RoI
        border is inside tile or margin
        margin is for tile
        margin size is shared between 2 adjacent tiles

        A regular row/col looks like (b - border, m - margin, T - tile):
        b|RoI1|b|tile - RoI1 - b|m - 2 * b|tile - RoI2 - b|b|RoI2|b

        A tileset looks like this:
        bbbbbbb
        bTmTmTb
        bmmmmmb
        bTmTmTb
        bbbbbbb
        """

        assert len(rois) <= np.prod(grid_size)

        # FIXME: RoI size is not limited by size, it can lead to highly uneven tiles
        base_tile_size = np.max([(sample.roi_h, sample.roi_w) for sample in rois], axis=0).astype(
            int
        )

        grid_size = np.array(grid_size, dtype=int)
        roi_border = np.array((2, 2), dtype=int)
        tile_margin = np.array((20, 20), dtype=int)
        assert np.all(2 * roi_border < tile_margin)

        frame_size = (
            base_tile_size * grid_size[::-1] + tile_margin * (grid_size[::-1] - 1) + 2 * roi_border
        )

        all_tile_coords = np.zeros((np.prod(grid_size), 4), dtype=float)  # x, y, w, h
        for grid_id, grid_pos in enumerate(product(range(grid_size[1]), range(grid_size[0]))):
            grid_pos = np.array(grid_pos[::-1], dtype=int)
            tile_coords = all_tile_coords[grid_id]
            tile_coords[:2] = (
                base_tile_size[::-1] * grid_pos
                + tile_margin / 2 * grid_pos
                + tile_margin / 2 * np.clip(grid_pos - 1, 0, None)
                + roi_border * (grid_pos > 0)
            )
            tile_coords[2:] = (
                base_tile_size[::-1]
                + tile_margin / 2
                + np.where(
                    (grid_pos == 0) | (grid_pos == (grid_size - 1)),
                    roi_border,
                    tile_margin / 2,
                )
            )

        all_roi_coords = np.zeros((np.prod(grid_size), 4), dtype=int)  # x, y, w, h
        for grid_id, roi_info in enumerate(rois):
            tile_coords = all_tile_coords[grid_id]
            roi_coords = all_roi_coords[grid_id]

            roi_size = np.array((roi_info.roi_h, roi_info.roi_w), dtype=int)
            roi_offset = tile_coords[2:] / 2 - roi_size[::-1] / 2
            roi_coords[:] = [*(tile_coords[:2] + roi_offset), *roi_size[::-1]]  # (x, y, w, h)

        return cls._TilesetParams(
            roi_ids=[roi.bbox_id for roi in rois],
            all_roi_coords=all_roi_coords,
            all_tile_coords=all_tile_coords,
            frame_size=frame_size[::-1],
            roi_border_size=roi_border,
            tile_margin_size=tile_margin,
        )

    def _mangle_filenames(self):
        """
        Mangle filenames in the dataset to make them less recognizable by annotators
        and hide private dataset info
        """
        assert self.tileset_params is not _unset

        # TODO: maybe add different names for the same GT images in
        # different jobs to make them even less recognizable
        self.tileset_filenames = {
            tileset_id: str(uuid.uuid4()) + self.tileset_file_ext
            for tileset_id in self.tileset_params.keys()
        }

    def _prepare_job_params(self):
        assert self.roi_infos is not _unset
        assert self.skeleton_bbox_mapping is not _unset

        # Make job layouts wrt. manifest params
        # 1 job per task, 1 task for each point label
        #
        # Unlike other task types, here we use a grid of RoIs,
        # so the absolute job size numbers from manifest are multiplied by the grid size.
        # Then, we add a percent of job tiles for validation, keeping the requested ratio.
        gt_percent = self.manifest.validation.val_size / (self.manifest.annotation.job_size or 1)

        job_params: List[self._JobParams] = []

        _roi_key_label = lambda roi_info: roi_info.bbox_label
        rois_by_label = {
            label: list(g)
            for label, g in groupby(sorted(self.roi_infos, key=_roi_key_label), key=_roi_key_label)
        }

        roi_info_by_id = {roi_info.bbox_id: roi_info for roi_info in self.roi_infos}

        tileset_size = np.prod(self.tileset_size)
        for label, label_rois in rois_by_label.items():
            # FIXME: RoI sizes are not limited, so they can occupy up to the whole image.
            # Sort by frame size to make tile sizes more aligned.
            # This doesn't totally solve the problem, but makes things better.
            label_rois = sorted(label_rois, key=lambda roi_info: roi_info.roi_w * roi_info.roi_h)

            label_gt_roi_ids = set(
                roi_id
                for roi_id in self.skeleton_bbox_mapping.values()
                if roi_info_by_id[roi_id].bbox_label == label
            )

            label_data_roi_ids = [
                roi_info.bbox_id
                for roi_info in self.roi_infos
                if roi_info.bbox_id not in label_gt_roi_ids
            ]
            # Can't really shuffle if we sort by size
            # TODO: maybe shuffle within bins by size
            # random.shuffle(label_data_roi_ids)

            for job_data_roi_ids in take_by(
                label_data_roi_ids, tileset_size * self.manifest.annotation.job_size
            ):
                job_gt_count = max(
                    self.manifest.validation.val_size, int(gt_percent * len(job_data_roi_ids))
                )
                job_gt_count = min(len(label_gt_roi_ids), job_gt_count)

                # TODO: maybe use size bins and take from them to match data sizes
                job_gt_roi_ids = random.sample(label_gt_roi_ids, k=job_gt_count)

                job_roi_ids = list(job_data_roi_ids) + list(job_gt_roi_ids)
                random.shuffle(job_roi_ids)

                job_params.append(self._JobParams(label_id=label, roi_ids=job_roi_ids))

        self.job_params = job_params

        self._prepare_dataset_tileset_params()

    def _upload_task_meta(self):
        # TODO:
        # raise NotImplementedError
        pass

    def _create_tileset_frame(
        self,
        tileset_params: _TilesetParams,
        roi_images: dict[int, np.ndarray],
    ) -> np.ndarray:
        frame = np.zeros((*tileset_params.frame_size, 3), dtype=np.uint8)
        frame[:, :] = self.tileset_background_color

        roi_border = tileset_params.roi_border_size
        border_color = self.tile_border_color

        for grid_pos, roi_id in enumerate(tileset_params.roi_ids):
            roi_coords = tileset_params.all_roi_coords[grid_pos].astype(int)
            roi_image = roi_images[grid_pos]

            if self.embed_tile_border:
                tile_coords = tileset_params.all_tile_coords[grid_pos].astype(int)
                frame[
                    tile_coords[1] : tile_coords[1] + tile_coords[3],
                    tile_coords[0] : tile_coords[0] + tile_coords[2],
                ] = 0

                frame[
                    tile_coords[1] + 1 : tile_coords[1] + tile_coords[3] - 2,
                    tile_coords[0] + 1 : tile_coords[0] + tile_coords[2] - 2,
                ] = self.tileset_background_color

            border_coords = np.array(
                [*(roi_coords[:2] - roi_border), *(roi_coords[2:] + 2 * roi_border)],
                dtype=int,
            )
            frame[
                border_coords[1] : border_coords[1] + border_coords[3],
                border_coords[0] : border_coords[0] + border_coords[2],
            ] = border_color

            frame[
                roi_coords[1] : roi_coords[1] + roi_coords[3],
                roi_coords[0] : roi_coords[0] + roi_coords[2],
            ] = roi_image[
                : roi_coords[3], : roi_coords[2]
            ]  # in some cases size can be truncated on previous iterations

        return frame

    def _draw_roi_bbox(self, roi_image: np.ndarray, bbox: dm.Bbox) -> np.ndarray:
        return cv2.rectangle(
            roi_image,
            tuple(map(int, (bbox.x, bbox.y))),
            tuple(map(int, (bbox.x + bbox.w, bbox.y + bbox.h))),
            self.roi_embedded_bbox_color,
            2,  # TODO: maybe improve line thickness
            cv2.LINE_4,
        )

    def _create_and_upload_tilesets(self):
        assert self.tileset_filenames is not _unset
        assert self.tileset_params is not _unset

        # TODO: optimize downloading, this implementation won't work for big datasets
        src_bucket = BucketAccessInfo.from_raw_url(self.manifest.data.data_url)
        src_prefix = ""
        dst_bucket = self.oracle_data_bucket

        src_client = self._make_cloud_storage_client(src_bucket)
        dst_client = self._make_cloud_storage_client(dst_bucket)

        image_id_to_filename = {
            sample.attributes["id"]: sample.image.path for sample in self.input_boxes_dataset
        }

        filename_to_sample = {sample.image.path: sample for sample in self.input_boxes_dataset}

        _roi_info_key = lambda e: e.original_image_key
        roi_info_by_image: Dict[str, Sequence[skeletons_from_boxes_task.RoiInfo]] = {
            image_id_to_filename[image_id]: list(g)
            for image_id, g in groupby(sorted(self.roi_infos, key=_roi_info_key), key=_roi_info_key)
        }

        bbox_by_id = {
            bbox.id: bbox
            for sample in self.input_boxes_dataset
            for bbox in sample.annotations
            if isinstance(bbox, dm.Bbox)
        }

        roi_images = {}
        for filename in self.input_filenames:
            image_roi_infos = roi_info_by_image.get(filename, [])
            if not image_roi_infos:
                continue

            image_bytes = src_client.download_file(
                src_bucket.url.bucket_name, os.path.join(src_prefix, filename)
            )
            image_pixels = decode_image(image_bytes)

            sample = filename_to_sample[filename]
            if tuple(sample.image.size) != tuple(image_pixels.shape[:2]):
                # TODO: maybe rois should be regenerated instead
                # Option 2: accumulate errors, fail when some threshold is reached
                # Option 3: add special handling for cases when image is only rotated (exif etc.)
                raise InvalidImageInfo(
                    f"Sample '{filename}': invalid size provided in the point annotations"
                )

            for roi_info in image_roi_infos:
                roi_pixels = image_pixels[
                    roi_info.roi_y : roi_info.roi_y + roi_info.roi_h,
                    roi_info.roi_x : roi_info.roi_x + roi_info.roi_w,
                ]

                if self.embed_bbox_in_roi_image:
                    roi_pixels = self._draw_roi_bbox(roi_pixels, bbox_by_id[roi_info.bbox_id])

                roi_images[roi_info.bbox_id] = roi_pixels

        for tileset_id, tileset_params in self.tileset_params.items():
            tileset_pixels = self._create_tileset_frame(
                tileset_params, roi_images=[roi_images[roi_id] for roi_id in tileset_params.roi_ids]
            )

            filename = self.tileset_filenames[tileset_id]
            tileset_bytes = encode_image(tileset_pixels, os.path.splitext(filename)[-1])

            dst_client.create_file(
                dst_bucket.url.bucket_name,
                filename=compose_data_bucket_filename(self.escrow_address, self.chain_id, filename),
                data=tileset_bytes,
            )

    def _create_on_cvat(self):
        assert self.job_params is not _unset

        input_data_bucket = BucketAccessInfo.from_raw_url(self.manifest.data.data_url)
        oracle_bucket = self.oracle_data_bucket

        # Register cloud storage on CVAT to pass user dataset
        cloud_storage = cvat_api.create_cloudstorage(
            CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER[oracle_bucket.provider],
            oracle_bucket.url.host_url.replace(
                # TODO: remove mock
                "127.0.0.1",
                "172.22.0.1",
            ),
            oracle_bucket.url.bucket_name,
            # TODO: add
            # credentials=...
        )

        # Create a project
        project = cvat_api.create_project(
            self.escrow_address,
            user_guide=self.manifest.annotation.user_guide,
            # TODO: improve guide handling - split for different points
        )

        # Setup webhooks for a project (update:task, update:job)
        webhook = cvat_api.create_cvat_webhook(project.id)

        input_data_bucket = parse_bucket_url(self.manifest.data.data_url)
        with SessionLocal.begin() as session:
            db_service.create_project(
                session,
                project.id,
                cloud_storage.id,
                self.manifest.annotation.type,
                self.escrow_address,
                self.chain_id,
                compose_bucket_url(
                    input_data_bucket.bucket_name,
                    bucket_host=input_data_bucket.host_url,
                    provider=input_data_bucket.provider,
                ),
                cvat_webhook_id=webhook.id,
            )
            db_service.add_project_images(
                session,
                project.id,
                [
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, fn)
                    for fn in self.tileset_filenames.values()
                ],
            )

        _job_params_label_key = lambda ts: ts.label_id
        jobs_by_label = {
            label_id: list(g)
            for label_id, g in groupby(
                sorted(self.job_params, key=_job_params_label_key), key=_job_params_label_key
            )
        }

        job_label_specs = {
            skeleton_label_id: [
                {
                    "name": point_name
                    if len(self.manifest.annotation.labels) == 1
                    else f"{skeleton_label}.{point_name}",
                    "type": "points",
                }
                for point_name in skeleton_label.nodes
            ]
            for skeleton_label_id, skeleton_label in enumerate(self.manifest.annotation.labels)
        }
        for skeleton_label_id, skeleton_label_jobs in jobs_by_label.items():
            job_filenames_map = []
            for job_filenames_map in skeleton_label_jobs:
                job_filenames_map.append(
                    [
                        compose_data_bucket_filename(
                            self.escrow_address, self.chain_id, self.tileset_filenames[tileset_id]
                        )
                        for tileset_id in skeleton_label_jobs.tileset_ids
                    ]
                )

            skeleton_label_specs = job_label_specs[skeleton_label_id]
            for label_spec in skeleton_label_specs:
                task = cvat_api.create_task(project.id, self.escrow_address, labels=[label_spec])

                with SessionLocal.begin() as session:
                    db_service.create_task(session, task.id, project.id, TaskStatus[task.status])

                # Actual task creation in CVAT takes some time, so it's done in an async process.
                # The task will be created in DB once 'update:task' or 'update:job' webhook is received.
                cvat_api.put_task_data(
                    task.id,
                    cloud_storage.id,
                    filenames=[
                        compose_data_bucket_filename(self.escrow_address, self.chain_id, fn)
                        for job_filenames in job_filenames_map
                        for fn in job_filenames
                    ],
                    sort_images=False,
                    job_filenames=job_filenames_map,
                )

                with SessionLocal.begin() as session:
                    db_service.create_data_upload(session, cvat_task_id=task.id)

    @classmethod
    def _make_cloud_storage_client(cls, bucket_info: BucketAccessInfo) -> StorageClient:
        return cloud_service.make_client(bucket_info)

    def build(self):
        self._download_input_data()
        self._parse_gt()
        self._parse_boxes()
        self._validate_gt()
        self._validate_boxes()

        # Task configuration creation
        self._prepare_gt()
        self._prepare_roi_infos()
        self._prepare_job_params()
        self._mangle_filenames()

        # Data preparation
        self._create_and_upload_tilesets()
        self._upload_task_meta()

        self._create_on_cvat()


def get_gt_filenames(
    gt_file_data: bytes, data_filenames: List[str], *, manifest: TaskManifest
) -> List[str]:
    with TemporaryDirectory() as gt_temp_dir:
        gt_filename = os.path.join(gt_temp_dir, "gt_annotations.json")
        with open(gt_filename, "wb") as f:
            f.write(gt_file_data)

        gt_dataset = dm.Dataset.import_from(
            gt_filename,
            format=DM_GT_DATASET_FORMAT_MAPPING[manifest.annotation.type],
        )

        gt_filenames = set(s.id + s.media.ext for s in gt_dataset)

    known_data_filenames = set(data_filenames)
    matched_gt_filenames = gt_filenames.intersection(known_data_filenames)

    if len(gt_filenames) != len(matched_gt_filenames):
        missing_gt = gt_filenames - matched_gt_filenames
        missing_gt_display_threshold = 10
        remainder = len(missing_gt) - missing_gt_display_threshold
        raise DatasetValidationError(
            "Failed to find several validation samples in the dataset files: {}{}".format(
                ", ".join(missing_gt[:missing_gt_display_threshold]),
                f"(and {remainder} more)" if remainder else "",
            )
        )

    if len(gt_filenames) < manifest.validation.val_size:
        raise TooFewSamples(
            f"Too few validation samples provided ({len(gt_filenames)}), "
            f"at least {manifest.validation.val_size} required."
        )

    return matched_gt_filenames


def make_job_configuration(
    data_filenames: List[str],
    gt_filenames: List[str],
    *,
    manifest: TaskManifest,
) -> List[List[str]]:
    # Make job layouts wrt. manifest params, 1 job per task (CVAT can't repeat images in jobs)
    gt_filenames_index = set(gt_filenames)
    data_filenames = [fn for fn in data_filenames if not fn in gt_filenames_index]
    random.shuffle(data_filenames)

    job_layout = []
    for data_samples in take_by(data_filenames, manifest.annotation.job_size):
        gt_samples = random.sample(gt_filenames, k=manifest.validation.val_size)
        job_samples = list(data_samples) + list(gt_samples)
        random.shuffle(job_samples)
        job_layout.append(job_samples)

    return job_layout


def is_image(path: str) -> bool:
    trunk, ext = os.path.splitext(os.path.basename(path))
    return trunk and ext.lower() in IMAGE_EXTENSIONS


def filter_image_files(data_filenames: List[str]) -> List[str]:
    return list(fn for fn in data_filenames if is_image(fn))


def make_label_configuration(manifest: TaskManifest) -> List[dict]:
    return [
        {
            "name": label.name,
            "type": LABEL_TYPE_MAPPING[manifest.annotation.type].value,
        }
        for label in manifest.annotation.labels
    ]


def create_task(escrow_address: str, chain_id: int) -> None:
    logger = get_function_logger(module_logger)

    manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))

    if manifest.annotation.type in [
        TaskType.image_boxes,
        TaskType.image_points,
        TaskType.image_label_binary,
    ]:
        data_bucket = parse_bucket_url(manifest.data.data_url)
        gt_bucket = parse_bucket_url(manifest.validation.gt_url)

        data_bucket_client = cloud_service.make_client(data_bucket)
        gt_bucket_client = cloud_service.make_client(gt_bucket)

        # Task configuration creation
        data_filenames = data_bucket_client.list_filenames(
            data_bucket.bucket_name,
            prefix=data_bucket.path,
        )
        data_filenames = filter_image_files(data_filenames)

        gt_file_data = gt_bucket_client.download_file(
            gt_bucket.bucket_name,
            gt_bucket.path,
        )

        # Validate and parse GT
        gt_filenames = get_gt_filenames(gt_file_data, data_filenames, manifest=manifest)

        job_configuration = make_job_configuration(data_filenames, gt_filenames, manifest=manifest)
        label_configuration = make_label_configuration(manifest)

        # Register cloud storage on CVAT to pass user dataset
        cloud_storage = cvat_api.create_cloudstorage(
            CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER[data_bucket.provider],
            data_bucket.host_url,
            data_bucket.bucket_name,
        )

        # Create a project
        project = cvat_api.create_project(
            escrow_address,
            labels=label_configuration,
            user_guide=manifest.annotation.user_guide,
        )

        # Setup webhooks for a project (update:task, update:job)
        webhook = cvat_api.create_cvat_webhook(project.id)

        with SessionLocal.begin() as session:
            db_service.create_project(
                session,
                project.id,
                cloud_storage.id,
                manifest.annotation.type,
                escrow_address,
                chain_id,
                compose_bucket_url(
                    data_bucket.bucket_name,
                    bucket_host=data_bucket.host_url,
                    provider=data_bucket.provider,
                ),
                cvat_webhook_id=webhook.id,
            )
            db_service.add_project_images(session, project.id, data_filenames)

        for job_filenames in job_configuration:
            task = cvat_api.create_task(project.id, escrow_address)

            with SessionLocal.begin() as session:
                db_service.create_task(session, task.id, project.id, TaskStatus[task.status])

            # Actual task creation in CVAT takes some time, so it's done in an async process.
            # The task will be created in DB once 'update:task' or 'update:job' webhook is received.
            cvat_api.put_task_data(
                task.id,
                cloud_storage.id,
                filenames=job_filenames,
                sort_images=False,
            )

            with SessionLocal.begin() as session:
                db_service.create_data_upload(session, cvat_task_id=task.id)

    elif manifest.annotation.type in [TaskType.image_boxes_from_points]:
        with BoxesFromPointsTaskBuilder(manifest, escrow_address, chain_id) as task_builder:
            task_builder.set_logger(logger)
            task_builder.build()

    elif manifest.annotation.type in [TaskType.image_skeletons_from_boxes]:
        with SkeletonsFromBoxesTaskBuilder(manifest, escrow_address, chain_id) as task_builder:
            task_builder.set_logger(logger)
            task_builder.build()

    else:
        raise Exception(f"Unsupported task type {manifest.annotation.type}")


def remove_task(escrow_address: str) -> None:
    with SessionLocal.begin() as session:
        project = db_service.get_project_by_escrow_address(session, escrow_address)
        if project is not None:
            if project.cvat_cloudstorage_id:
                cvat_api.delete_cloudstorage(project.cvat_cloudstorage_id)
            if project.cvat_id:
                cvat_api.delete_project(project.cvat_id)
            db_service.delete_project(session, project.id)
