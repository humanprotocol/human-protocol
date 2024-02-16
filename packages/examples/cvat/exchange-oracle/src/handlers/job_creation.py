from __future__ import annotations

import os
import random
import uuid
from contextlib import ExitStack
from itertools import groupby
from logging import Logger
from math import ceil
from tempfile import TemporaryDirectory
from typing import Dict, List, Sequence, Tuple, Union, cast

import cv2
import datumaro as dm
import numpy as np
from datumaro.util import take_by
from datumaro.util.image import IMAGE_EXTENSIONS, decode_image, encode_image

import src.core.tasks.boxes_from_points as boxes_from_points_task
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
from src.services.cloud import CloudProvider, StorageClient
from src.services.cloud.utils import BucketAccessInfo, compose_bucket_url
from src.utils.assignments import parse_manifest
from src.utils.logging import NullLogger, get_function_logger

module_logger = f"{ROOT_LOGGER_NAME}.cron.cvat"

LABEL_TYPE_MAPPING = {
    TaskType.image_label_binary: CvatLabelType.tag,
    TaskType.image_points: CvatLabelType.points,
    TaskType.image_boxes: CvatLabelType.rectangle,
    TaskType.image_boxes_from_points: CvatLabelType.rectangle,
}

DM_DATASET_FORMAT_MAPPING = {
    TaskType.image_label_binary: "cvat_images",
    TaskType.image_points: "coco_person_keypoints",
    TaskType.image_boxes: "coco_instances",
    TaskType.image_boxes_from_points: "coco_instances",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    # GT uses the same format both for boxes and points
    TaskType.image_label_binary: "cvat_images",
    TaskType.image_points: "coco_instances",
    TaskType.image_boxes: "coco_instances",
    TaskType.image_boxes_from_points: "coco_instances",
}

CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER = {
    CloudProvider.aws: "AWS_S3_BUCKET",
    CloudProvider.gcs: "GOOGLE_CLOUD_STORAGE",
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


class BoxesFromPointsTaskBuilder:
    class _NotConfigured:
        def __bool__(self) -> bool:
            return False

    _not_configured = _NotConfigured()

    def __init__(self, manifest: TaskManifest, escrow_address: str, chain_id: int):
        self.exit_stack = ExitStack()
        self.manifest = manifest
        self.escrow_address = escrow_address
        self.chain_id = chain_id

        self.logger: Logger = NullLogger()

        self.input_gt_data: Union[bytes, self._NotConfigured] = self._not_configured
        self.input_points_data: Union[bytes, self._NotConfigured] = self._not_configured

        # Computed values
        self.input_filenames: Union[self._NotConfigured, Sequence[str]] = self._not_configured
        self.input_gt_dataset: Union[self._NotConfigured, dm.Dataset] = self._not_configured
        self.input_points_dataset: Union[self._NotConfigured, dm.Dataset] = self._not_configured

        # Output values
        self.gt_dataset: Union[dm.Dataset, self._NotConfigured] = self._not_configured

        self.bbox_point_mapping: Union[
            boxes_from_points_task.BboxPointMapping, self._NotConfigured
        ] = self._not_configured
        "bbox_id -> point_id"

        self.roi_size_estimations: Union[
            Dict[int, Tuple[float, float]], self._NotConfigured
        ] = self._not_configured
        "label_id -> (rel. w, rel. h)"

        self.rois: Union[
            boxes_from_points_task.RoiInfos, self._NotConfigured
        ] = self._not_configured
        self.roi_filenames: Union[
            boxes_from_points_task.RoiFilenames, self._NotConfigured
        ] = self._not_configured

        self.job_layout: Union[Sequence[Sequence[str]], self._NotConfigured] = self._not_configured
        "File lists per CVAT job"

        self.label_configuration: Union[Sequence[dict], self._NotConfigured] = self._not_configured

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

        self.oracle_data_bucket = BucketAccessInfo.parse_obj(Config.storage_config)
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
        data_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
        gt_bucket = BucketAccessInfo.parse_obj(self.manifest.validation.gt_url)
        points_bucket = BucketAccessInfo.parse_obj(self.manifest.data.points_url)

        data_storage_client = self._make_cloud_storage_client(data_bucket)
        gt_storage_client = self._make_cloud_storage_client(gt_bucket)
        points_storage_client = self._make_cloud_storage_client(points_bucket)

        data_filenames = data_storage_client.list_files(prefix=data_bucket.path)
        self.input_filenames = filter_image_files(data_filenames)

        self.input_gt_data = gt_storage_client.download_fileobj(gt_bucket.path)

        self.input_points_data = points_storage_client.download_fileobj(points_bucket.path)

    def _parse_dataset(self, annotation_file_data: bytes, dataset_format: str) -> dm.Dataset:
        temp_dir = self.exit_stack.enter_context(TemporaryDirectory())

        annotation_filename = os.path.join(temp_dir, "annotations.json")
        with open(annotation_filename, "wb") as f:
            f.write(annotation_file_data)

        return dm.Dataset.import_from(annotation_filename, format=dataset_format)

    def _parse_gt(self):
        assert self.input_gt_data is not self._not_configured

        self.input_gt_dataset = self._parse_dataset(
            self.input_gt_data,
            dataset_format=DM_GT_DATASET_FORMAT_MAPPING[self.manifest.annotation.type],
        )

    def _parse_points(self):
        assert self.input_points_data is not self._not_configured

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
        assert self.input_filenames is not self._not_configured
        assert self.input_gt_dataset is not self._not_configured

        self._validate_gt_filenames()
        self._validate_gt_labels()

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
        points_filenames = set()
        filenames_with_invalid_points = set()
        for sample in self.input_points_dataset:
            sample_id = sample.id + sample.media.ext
            points_filenames.add(sample_id)

            skeletons = [a for a in sample.annotations if isinstance(a, dm.Skeleton)]
            for skeleton in skeletons:
                if len(skeleton.elements) != 1:
                    filenames_with_invalid_points.add(sample_id)
                    break

        if filenames_with_invalid_points:
            raise MismatchingAnnotations(
                "Some images have invalid points: {}".format(
                    self._format_list(filenames_with_invalid_points)
                )
            )

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
            image_h, image_w = sample.image.size

            for skeleton in sample.annotations:
                # Could fail on this as well
                if not isinstance(skeleton, dm.Skeleton):
                    continue

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
            self.logger.info(
                "Some samples were excluded due to errors found: {}".format(
                    self._format_list([m for _, m in excluded_samples], separator="\n")
                )
            )

    def _validate_points(self):
        assert self.input_filenames is not self._not_configured
        assert self.input_points_dataset is not self._not_configured

        self._validate_points_categories()
        self._validate_points_filenames()
        self._validate_points_annotations()

    @staticmethod
    def _is_point_in_bbox(px: float, py: float, bbox: dm.Bbox) -> bool:
        return (bbox.x <= px <= bbox.x + bbox.w) and (bbox.y <= py <= bbox.y + bbox.h)

    def _prepare_gt(self):
        assert self.input_filenames is not self._not_configured
        assert self.input_points_dataset is not self._not_configured
        assert self.input_gt_dataset is not self._not_configured
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
        gt_per_class = {}

        bbox_point_mapping = {}  # bbox id -> point id
        for gt_sample in self.input_gt_dataset:
            points_sample = self.input_points_dataset.get(gt_sample.id, gt_sample.subset)
            assert points_sample

            image_h, image_w = points_sample.image.size

            gt_boxes = [a for a in gt_sample.annotations if isinstance(a, dm.Bbox)]
            input_skeletons = [a for a in points_sample.annotations if isinstance(a, dm.Skeleton)]

            # Samples without boxes are allowed
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
            self.logger.info(self._format_list(excluded_boxes_messages, separator="\n"))

        gt_labels_without_anns = [
            gt_label_cat[label_id]
            for label_id, label_count in gt_per_class.items()
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
        assert self.gt_dataset is not self._not_configured
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
            self.logger.debug(
                "Some classes will use the full image instead of RoI"
                "- too few GT provided: {}".format(
                    self._format_list(
                        [label_cat[label_id].name for label_id in classes_with_default_roi]
                    )
                )
            )

        self.roi_size_estimations = roi_size_estimations_per_label

    def _prepare_roi_info(self):
        assert self.gt_dataset is not self._not_configured
        assert self.roi_size_estimations is not self._not_configured
        assert self.input_points_dataset is not self._not_configured

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
        assert self.rois is not self._not_configured

        # TODO: maybe add different names for the same GT images in
        # different jobs to make them even less recognizable
        self.roi_filenames = {
            roi.point_id: str(uuid.uuid4()) + self.roi_file_ext for roi in self.rois
        }

    def _prepare_job_layout(self):
        # Make job layouts wrt. manifest params
        # 1 job per task as CVAT can't repeat images in jobs, but GTs can repeat in the dataset

        assert self.rois is not self._not_configured
        assert self.bbox_point_mapping is not self._not_configured

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
        # TODO: maybe extract into a separate function / class / library,
        # extract constants, serialization methods return TaskConfig from build()

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
        bucket_name = self.oracle_data_bucket.bucket_name
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
        assert self.input_points_dataset is not self._not_configured
        assert self.rois is not self._not_configured
        assert self.input_filenames is not self._not_configured
        assert self.roi_filenames is not self._not_configured

        src_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
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

            image_bytes = src_client.download_fileobj(os.path.join(src_prefix, filename))
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
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, roi_filename),
                    roi_bytes,
                )

    def _create_on_cvat(self):
        assert self.job_layout is not self._not_configured
        assert self.label_configuration is not self._not_configured

        input_data_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
        oracle_bucket = self.oracle_data_bucket

        # Register cloud storage on CVAT to pass user dataset
        cloud_storage = cvat_api.create_cloudstorage(
            CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER[oracle_bucket.provider],
            oracle_bucket.bucket_name,
            bucket_host=oracle_bucket.host_url.replace(
                # TODO: remove mock
                "127.0.0.1",
                "172.22.0.1",
            ),
            **({ "credentials": oracle_bucket.credentials.to_dict() } if oracle_bucket.credentials else {})
        )

        # Create a project
        project = cvat_api.create_project(
            self.escrow_address,
            labels=self.label_configuration,
            user_guide=self.manifest.annotation.user_guide,
        )

        # Setup webhooks for a project (update:task, update:job)
        webhook = cvat_api.create_cvat_webhook(project.id)

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
        data_bucket = BucketAccessInfo.parse_obj(manifest.data.data_url)
        gt_bucket = BucketAccessInfo.parse_obj(manifest.validation.gt_url)

        data_bucket_client = cloud_service.make_client(data_bucket)
        gt_bucket_client = cloud_service.make_client(gt_bucket)

        # Task configuration creation
        data_filenames = data_bucket_client.list_files(
            prefix=data_bucket.path,
        )
        data_filenames = filter_image_files(data_filenames)

        gt_file_data = gt_bucket_client.download_fileobj(
            gt_bucket.path,
        )

        # Validate and parse GT
        gt_filenames = get_gt_filenames(gt_file_data, data_filenames, manifest=manifest)

        job_configuration = make_job_configuration(data_filenames, gt_filenames, manifest=manifest)
        label_configuration = make_label_configuration(manifest)

        # Register cloud storage on CVAT to pass user dataset
        cloud_storage = cvat_api.create_cloudstorage(
            CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER[data_bucket.provider],
            data_bucket.bucket_name,
            bucket_host=data_bucket.host_url,
            **({ "credentials": data_bucket.credentials.to_dict() } if data_bucket.credentials else {})
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
