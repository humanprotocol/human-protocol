from __future__ import annotations

import os
import random
import uuid
from contextlib import ExitStack
from dataclasses import dataclass, field
from itertools import chain, groupby
from logging import Logger
from math import ceil
from tempfile import TemporaryDirectory
from typing import Dict, List, Optional, Sequence, Tuple, TypeVar, Union, cast

import cv2
import datumaro as dm
import numpy as np
from datumaro.util import take_by
from datumaro.util.annotation_util import BboxCoords, bbox_iou
from datumaro.util.image import IMAGE_EXTENSIONS, decode_image, encode_image

import src.core.tasks.boxes_from_points as boxes_from_points_task
import src.core.tasks.simple as simple_task
import src.core.tasks.skeletons_from_boxes as skeletons_from_boxes_task
import src.cvat.api_calls as cvat_api
import src.services.cloud as cloud_service
import src.services.cvat as db_service
from src.chain.escrow import get_escrow_manifest
from src.core.config import Config
from src.core.manifest import TaskManifest
from src.core.storage import compose_data_bucket_filename
from src.core.types import CvatLabelTypes, TaskStatuses, TaskTypes
from src.db import SessionLocal
from src.log import ROOT_LOGGER_NAME
from src.services.cloud import CloudProviders, StorageClient
from src.services.cloud.utils import BucketAccessInfo, compose_bucket_url
from src.utils.annotations import InstanceSegmentsToBbox, ProjectLabels, is_point_in_bbox
from src.utils.assignments import parse_manifest
from src.utils.logging import NullLogger, get_function_logger

module_logger = f"{ROOT_LOGGER_NAME}.cron.cvat"

LABEL_TYPE_MAPPING = {
    TaskTypes.image_label_binary: CvatLabelTypes.tag,
    TaskTypes.image_points: CvatLabelTypes.points,
    TaskTypes.image_boxes: CvatLabelTypes.rectangle,
    TaskTypes.image_boxes_from_points: CvatLabelTypes.rectangle,
    TaskTypes.image_skeletons_from_boxes: CvatLabelTypes.points,
}

DM_DATASET_FORMAT_MAPPING = {
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_points: "coco_person_keypoints",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    # GT uses the same format both for boxes and points
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_points: "coco_instances",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
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


class InvalidCoordinates(DatasetValidationError):
    pass


class InvisibleSkeletonError(DatasetValidationError):
    pass


T = TypeVar("T")


class _Undefined:
    def __bool__(self) -> bool:
        return False


_unset = _Undefined()

_MaybeUnset = Union[T, _Undefined]


@dataclass
class _ExcludedAnnotationInfo:
    message: str
    sample_id: str = field(kw_only=True)
    sample_subset: str = field(kw_only=True)


@dataclass
class _ExcludedAnnotationsInfo:
    messages: List[_ExcludedAnnotationInfo] = field(default_factory=list)

    excluded_count: int = 0
    "The number of excluded annotations. Can be different from len(messages)"

    total_count: int = 0

    def add_message(self, message: str, *, sample_id: str, sample_subset: str):
        self.messages.append(
            _ExcludedAnnotationInfo(
                message=message, sample_id=sample_id, sample_subset=sample_subset
            )
        )


class SimpleTaskBuilder:
    """
    Handles task creation for IMAGE_POINTS and IMAGE_BOXES task types
    """

    def __init__(self, manifest: TaskManifest, escrow_address: str, chain_id: int):
        self.exit_stack = ExitStack()
        self.manifest = manifest
        self.escrow_address = escrow_address
        self.chain_id = chain_id

        self.logger: Logger = NullLogger()

        self._oracle_data_bucket = BucketAccessInfo.parse_obj(Config.storage_config)

        self.list_display_threshold = 5
        "The maximum number of rendered list items in a message"

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

    def _format_list(
        self, items: Sequence[str], *, max_items: int = None, separator: str = ", "
    ) -> str:
        if max_items is None:
            max_items = self.list_display_threshold

        remainder_count = len(items) - max_items
        return "{}{}".format(
            separator.join(items[:max_items]),
            f" (and {remainder_count} more)" if remainder_count > 0 else "",
        )

    @classmethod
    def _make_cloud_storage_client(cls, bucket_info: BucketAccessInfo) -> StorageClient:
        return cloud_service.make_client(bucket_info)

    def _upload_task_meta(self, gt_dataset: dm.Dataset):
        layout = simple_task.TaskMetaLayout()
        serializer = simple_task.TaskMetaSerializer()

        file_list = []
        file_list.append(
            (
                serializer.serialize_gt_annotations(gt_dataset),
                layout.GT_FILENAME,
            )
        )

        storage_client = self._make_cloud_storage_client(self._oracle_data_bucket)
        for file_data, filename in file_list:
            storage_client.create_file(
                compose_data_bucket_filename(self.escrow_address, self.chain_id, filename),
                file_data,
            )

    def _parse_gt_dataset(
        self, gt_file_data: bytes, *, add_prefix: Optional[str] = None
    ) -> dm.Dataset:
        with TemporaryDirectory() as gt_temp_dir:
            gt_filename = os.path.join(gt_temp_dir, "gt_annotations.json")
            with open(gt_filename, "wb") as f:
                f.write(gt_file_data)

            gt_dataset = dm.Dataset.import_from(
                gt_filename,
                format=DM_GT_DATASET_FORMAT_MAPPING[self.manifest.annotation.type],
            )

            if add_prefix:
                gt_dataset = dm.Dataset.from_iterable(
                    [s.wrap(id=os.path.join(add_prefix, s.id)) for s in gt_dataset],
                    categories=gt_dataset.categories(),
                    media_type=gt_dataset.media_type(),
                )

            gt_dataset.init_cache()

            return gt_dataset

    def _get_gt_filenames(
        self, gt_dataset: dm.Dataset, data_filenames: List[str], *, manifest: TaskManifest
    ) -> List[str]:
        gt_filenames = set(s.id + s.media.ext for s in gt_dataset)
        known_data_filenames = set(data_filenames)
        matched_gt_filenames = gt_filenames.intersection(known_data_filenames)

        if len(gt_filenames) != len(matched_gt_filenames):
            missing_gt = gt_filenames - matched_gt_filenames
            raise DatasetValidationError(
                "Failed to find several validation samples in the dataset files: {}".format(
                    self._format_list(list(missing_gt))
                )
            )

        if len(gt_filenames) < manifest.validation.val_size:
            raise TooFewSamples(
                f"Too few validation samples provided ({len(gt_filenames)}), "
                f"at least {manifest.validation.val_size} required."
            )

        return matched_gt_filenames

    def _make_job_configuration(
        self,
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

    def build(self):
        manifest = self.manifest
        escrow_address = self.escrow_address
        chain_id = self.chain_id

        data_bucket = BucketAccessInfo.parse_obj(manifest.data.data_url)
        gt_bucket = BucketAccessInfo.parse_obj(manifest.validation.gt_url)

        data_bucket_client = cloud_service.make_client(data_bucket)
        gt_bucket_client = cloud_service.make_client(gt_bucket)

        # Task configuration creation
        data_filenames = data_bucket_client.list_files(prefix=data_bucket.path)
        data_filenames = filter_image_files(data_filenames)

        gt_file_data = gt_bucket_client.download_file(gt_bucket.path)

        # Validate and parse GT
        gt_dataset = self._parse_gt_dataset(gt_file_data, add_prefix=data_bucket.path)

        # Create task configuration
        gt_filenames = self._get_gt_filenames(gt_dataset, data_filenames, manifest=manifest)
        job_configuration = self._make_job_configuration(
            data_filenames, gt_filenames, manifest=manifest
        )
        label_configuration = make_label_configuration(manifest)

        self._upload_task_meta(gt_dataset)

        # Register cloud storage on CVAT to pass user dataset
        cloud_storage = cvat_api.create_cloudstorage(**_make_cvat_cloud_storage_params(data_bucket))

        # Create a project
        cvat_project = cvat_api.create_project(
            escrow_address,
            labels=label_configuration,
            user_guide=manifest.annotation.user_guide,
        )

        # Setup webhooks for a project (update:task, update:job)
        cvat_webhook = cvat_api.create_cvat_webhook(cvat_project.id)

        with SessionLocal.begin() as session:
            total_jobs = len(job_configuration)
            self.logger.info(
                "Task creation for escrow '%s': will create %s assignments",
                escrow_address,
                total_jobs,
            )
            db_service.create_escrow_creation(
                session, escrow_address=escrow_address, chain_id=chain_id, total_jobs=total_jobs
            )

            project_id = db_service.create_project(
                session,
                cvat_project.id,
                cloud_storage.id,
                manifest.annotation.type,
                escrow_address,
                chain_id,
                compose_bucket_url(
                    data_bucket.bucket_name,
                    bucket_host=data_bucket.host_url,
                    provider=data_bucket.provider,
                ),
                cvat_webhook_id=cvat_webhook.id,
            )

            db_service.get_project_by_id(session, project_id, for_update=True)  # lock the row
            db_service.add_project_images(session, cvat_project.id, data_filenames)

            for job_filenames in job_configuration:
                cvat_task = cvat_api.create_task(cvat_project.id, escrow_address)

                task_id = db_service.create_task(
                    session, cvat_task.id, cvat_project.id, TaskStatuses[cvat_task.status]
                )
                db_service.get_task_by_id(session, task_id, for_update=True)  # lock the row

                # Actual task creation in CVAT takes some time, so it's done in an async process.
                # The task is fully created once 'update:task' or 'update:job' webhook is received.
                cvat_api.put_task_data(
                    cvat_task.id,
                    cloud_storage.id,
                    filenames=job_filenames,
                    sort_images=False,
                )

                db_service.create_data_upload(session, cvat_task.id)


class BoxesFromPointsTaskBuilder:
    def __init__(self, manifest: TaskManifest, escrow_address: str, chain_id: int):
        self.exit_stack = ExitStack()
        self.manifest = manifest
        self.escrow_address = escrow_address
        self.chain_id = chain_id

        self.logger: Logger = NullLogger()

        self._input_gt_data: _MaybeUnset[bytes] = _unset
        self._input_points_data: _MaybeUnset[bytes] = _unset

        self._data_filenames: _MaybeUnset[Sequence[str]] = _unset
        self._input_gt_dataset: _MaybeUnset[dm.Dataset] = _unset
        self._gt_dataset: _MaybeUnset[dm.Dataset] = _unset
        self._points_dataset: _MaybeUnset[dm.Dataset] = _unset

        self._bbox_point_mapping: _MaybeUnset[boxes_from_points_task.BboxPointMapping] = _unset
        "bbox_id -> point_id"

        self._roi_size_estimations: _MaybeUnset[Dict[int, Tuple[float, float]]] = _unset
        "label_id -> (rel. w, rel. h)"

        self._rois: _MaybeUnset[boxes_from_points_task.RoiInfos] = _unset
        self._roi_filenames: _MaybeUnset[boxes_from_points_task.RoiFilenames] = _unset

        self._job_layout: _MaybeUnset[Sequence[Sequence[str]]] = _unset
        "File lists per CVAT job"

        self._label_configuration: _MaybeUnset[Sequence[dict]] = _unset

        self._excluded_points_info: _MaybeUnset[_ExcludedAnnotationsInfo] = _unset
        self._excluded_gt_info: _MaybeUnset[_ExcludedAnnotationsInfo] = _unset

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
        data_filenames = strip_bucket_prefix(data_filenames, prefix=data_bucket.path)
        self._data_filenames = filter_image_files(data_filenames)

        self._input_gt_data = gt_storage_client.download_file(gt_bucket.path)

        self._input_points_data = points_storage_client.download_file(points_bucket.path)

    def _parse_dataset(self, annotation_file_data: bytes, dataset_format: str) -> dm.Dataset:
        temp_dir = self.exit_stack.enter_context(TemporaryDirectory())

        annotation_filename = os.path.join(temp_dir, "annotations.json")
        with open(annotation_filename, "wb") as f:
            f.write(annotation_file_data)

        return dm.Dataset.import_from(annotation_filename, format=dataset_format)

    def _parse_gt(self):
        assert self._input_gt_data is not _unset

        self._input_gt_dataset = self._parse_dataset(
            self._input_gt_data,
            dataset_format=DM_GT_DATASET_FORMAT_MAPPING[self.manifest.annotation.type],
        )

    def _parse_points(self):
        assert self._input_points_data is not _unset

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
                    self._format_list(list(gt_labels - manifest_labels)),
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
                    self._format_list(extra_gt)
                )
            )

        if len(gt_filenames) < self.manifest.validation.val_size:
            raise TooFewSamples(
                f"Too few validation samples provided ({len(gt_filenames)}), "
                f"at least {self.manifest.validation.val_size} required."
            )

    def _validate_gt_annotations(self):
        label_cat: dm.LabelCategories = self._input_gt_dataset.categories()[dm.AnnotationType.label]

        excluded_gt_info = _ExcludedAnnotationsInfo()
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
                    self._format_list(
                        [e.message for e in excluded_gt_info.messages], separator="\n"
                    )
                )
            )

        if excluded_gt_info.excluded_count > ceil(
            excluded_gt_info.total_count * self.max_discarded_threshold
        ):
            raise TooFewSamples(
                "Too many GT boxes discarded, canceling job creation. Errors: {}".format(
                    self._format_list(
                        [error_info.message for error_info in excluded_gt_info.messages]
                    )
                )
            )

        self._excluded_gt_info = excluded_gt_info

    def _validate_gt(self):
        assert self._data_filenames is not _unset
        assert self._input_gt_dataset is not _unset

        self._validate_gt_filenames()
        self._validate_gt_labels()
        self._validate_gt_annotations()

    def _format_list(
        self, items: Sequence[str], *, max_items: int = None, separator: str = ", "
    ) -> str:
        if max_items is None:
            max_items = self.list_display_threshold

        remainder_count = len(items) - max_items
        return "{}{}".format(
            separator.join(items[:max_items]),
            f" (and {remainder_count} more)" if remainder_count > 0 else "",
        )

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
                    self._format_list(invalid_point_categories_messages, separator="; ")
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
                    self._format_list(extra_point_samples),
                )
            )

    def _validate_points_annotations(self):
        def _validate_skeleton(skeleton: dm.Skeleton, *, sample_bbox: dm.Bbox):
            if skeleton.id in visited_ids:
                raise DatasetValidationError(f"repeated annotation id ({skeleton.id})")

            if len(skeleton.elements) != 1:
                raise DatasetValidationError(
                    "invalid points count ({}), expected 1".format(len(skeleton.elements))
                )

            point = skeleton.elements[0]
            px, py = point.points[:2]
            if not is_point_in_bbox(px, py, sample_bbox):
                raise InvalidCoordinates("coordinates are outside image")

        label_cat: dm.LabelCategories = self._points_dataset.categories()[dm.AnnotationType.label]

        excluded_points_info = _ExcludedAnnotationsInfo()
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
                    self._format_list(
                        [e.message for e in excluded_points_info.messages], separator="\n"
                    )
                )
            )

        if excluded_points_info.excluded_count > ceil(
            excluded_points_info.total_count * self.max_discarded_threshold
        ):
            raise TooFewSamples(
                "Too many points discarded, canceling job creation. Errors: {}".format(
                    self._format_list(
                        [error_info.message for error_info in excluded_points_info.messages]
                    )
                )
            )

        self._excluded_points_info = excluded_points_info

    def _validate_points(self):
        assert self._data_filenames is not _unset
        assert self._points_dataset is not _unset

        self._validate_points_categories()
        self._validate_points_filenames()
        self._validate_points_annotations()

    @staticmethod
    def _is_point_in_bbox(px: float, py: float, bbox: dm.Bbox) -> bool:
        return is_point_in_bbox(px, py, bbox)

    def _prepare_gt(self):
        def _find_unambiguous_matches(
            input_skeletons: List[dm.Skeleton],
            gt_boxes: List[dm.Bbox],
        ) -> List[Tuple[dm.Skeleton, dm.Bbox]]:
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
                matched_boxes: List[dm.Bbox] = [
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
                            self._format_list([f"#{a.id}" for a in matched_boxes]),
                        ),
                        sample_id=points_sample.id,
                        sample_subset=points_sample.subset,
                    )
                    # not an error, should not be counted as excluded for an error
                    ambiguous_skeletons.add(input_skeleton.id)
                    ambiguous_boxes.update(a.id for a in matched_boxes)
                    continue

            for gt_idx, gt_bbox in enumerate(gt_boxes):
                matched_skeletons: List[dm.Skeleton] = [
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
                            self._format_list([f"#{a.id}" for a in matched_skeletons]),
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    # not an error, should not be counted as excluded for an error
                    ambiguous_boxes.add(gt_bbox.id)
                    ambiguous_skeletons.update(a.id for a in matched_skeletons)
                    continue
                elif not matched_skeletons:
                    # Handle unmatched skeletons
                    excluded_gt_info.add_message(
                        "Sample '{}': GT bbox #{} ({}) skipped - "
                        "no matching points found".format(
                            gt_sample.id,
                            gt_bbox.id,
                            gt_label_cat[gt_bbox.label].name,
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    excluded_gt_info.excluded_count += 1  # an error
                    continue

            unambiguous_matches: List[Tuple[dm.Bbox, dm.Skeleton]] = []
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
            input_skeletons: List[dm.Skeleton],
            gt_boxes: List[dm.Bbox],
        ) -> List[dm.Bbox]:
            matches = _find_unambiguous_matches(input_skeletons, gt_boxes)

            matched_boxes = []
            for input_skeleton, gt_bbox in matches:
                gt_count_per_class[gt_bbox.label] = gt_count_per_class.get(gt_bbox.label, 0) + 1

                matched_boxes.append(gt_bbox)
                bbox_point_mapping[gt_bbox.id] = input_skeleton.id

            return matched_boxes

        assert self._data_filenames is not _unset
        assert self._points_dataset is not _unset
        assert self._input_gt_dataset is not _unset
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

        excluded_points_info = _ExcludedAnnotationsInfo()  # local for the function
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
                    self._format_list(
                        [e.message for e in excluded_points_info.messages], separator="\n"
                    )
                )
            )

        if excluded_gt_info.messages:
            self.logger.warning(
                "Some GT annotations were excluded due to the problems found: \n{}".format(
                    self._format_list(
                        [e.message for e in excluded_gt_info.messages], separator="\n"
                    )
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
                self._format_list(
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
                    self._format_list(gt_labels_without_anns)
                )
            )

        self._gt_dataset = updated_gt_dataset
        self._bbox_point_mapping = bbox_point_mapping

    def _estimate_roi_sizes(self):
        assert self._gt_dataset is not _unset
        assert [label.name for label in self._gt_dataset.categories()[dm.AnnotationType.label]] == [
            label.name for label in self.manifest.annotation.labels
        ]

        bbox_sizes_per_label = {}
        for sample in self._gt_dataset:
            image_h, image_w = self._points_dataset.get(sample.id, sample.subset).image.size

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
                g_reason: list(v[0] for v in g_items)
                for g_reason, g_items in groupby(
                    sorted(classes_with_default_roi.items(), key=lambda v: v[1]), key=lambda v: v[1]
                )
            }
            self.logger.warning(
                "Some classes will use the full image instead of RoI - {}".format(
                    "; ".join(
                        "{}: {}".format(
                            g_reason,
                            self._format_list([label_cat[label_id].name for label_id in g_labels]),
                        )
                        for g_reason, g_labels in labels_by_reason.items()
                    )
                )
            )

        self._roi_size_estimations = roi_size_estimations_per_label

    def _prepare_roi_info(self):
        assert self._gt_dataset is not _unset
        assert self._roi_size_estimations is not _unset
        assert self._points_dataset is not _unset

        rois: List[boxes_from_points_task.RoiInfo] = []
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
        assert self._rois is not _unset

        # TODO: maybe add different names for the same GT images in
        # different jobs to make them even less recognizable
        self._roi_filenames = {
            roi.point_id: str(uuid.uuid4()) + self.roi_file_ext for roi in self._rois
        }

    def _prepare_job_layout(self):
        # Make job layouts wrt. manifest params
        # 1 job per task as CVAT can't repeat images in jobs, but GTs can repeat in the dataset

        assert self._rois is not _unset
        assert self._bbox_point_mapping is not _unset
        assert self._input_gt_dataset is not _unset

        # This list can be different from what is selected for validation
        input_gt_filenames = set(sample.media.path for sample in self._input_gt_dataset)
        original_image_id_to_filename = {
            sample.attributes["id"]: sample.media.path for sample in self._points_dataset
        }
        point_id_to_original_image_id = {roi.point_id: roi.original_image_key for roi in self._rois}

        gt_point_ids = set(self._bbox_point_mapping.values())
        gt_filenames = [self._roi_filenames[point_id] for point_id in gt_point_ids]

        data_filenames = [
            fn
            for point_id, fn in self._roi_filenames.items()
            if not point_id in gt_point_ids
            if not original_image_id_to_filename[point_id_to_original_image_id[point_id]]
            in input_gt_filenames
        ]
        random.shuffle(data_filenames)

        job_layout = []
        for data_samples in take_by(data_filenames, self.manifest.annotation.job_size):
            gt_samples = random.sample(gt_filenames, k=self.manifest.validation.val_size)
            job_samples = list(data_samples) + list(gt_samples)
            random.shuffle(job_samples)
            job_layout.append(job_samples)

        self._job_layout = job_layout

    def _prepare_label_configuration(self):
        self._label_configuration = make_label_configuration(self.manifest)

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
        assert self._points_dataset is not _unset
        assert self._rois is not _unset
        assert self._data_filenames is not _unset
        assert self._roi_filenames is not _unset

        src_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
        src_prefix = src_bucket.path
        dst_bucket = self.oracle_data_bucket

        src_client = self._make_cloud_storage_client(src_bucket)
        dst_client = self._make_cloud_storage_client(dst_bucket)

        image_id_to_filename = {
            sample.attributes["id"]: sample.image.path for sample in self._points_dataset
        }

        filename_to_sample = {sample.image.path: sample for sample in self._points_dataset}

        _roi_key = lambda e: e.original_image_key
        rois_by_image: Dict[str, Sequence[boxes_from_points_task.RoiInfo]] = {
            image_id_to_filename[image_id]: list(g)
            for image_id, g in groupby(sorted(self._rois, key=_roi_key), key=_roi_key)
        }

        for filename in self._data_filenames:
            image_roi_infos = rois_by_image.get(filename, [])
            if not image_roi_infos:
                continue

            image_bytes = src_client.download_file(os.path.join(src_prefix, filename))
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

    def _create_on_cvat(self):
        assert self._job_layout is not _unset
        assert self._label_configuration is not _unset

        input_data_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
        oracle_bucket = self.oracle_data_bucket

        # Register cloud storage on CVAT to pass user dataset
        cvat_cloud_storage = cvat_api.create_cloudstorage(
            **_make_cvat_cloud_storage_params(oracle_bucket)
        )

        # Create a project
        cvat_project = cvat_api.create_project(
            self.escrow_address,
            labels=self._label_configuration,
            user_guide=self.manifest.annotation.user_guide,
        )

        # Setup webhooks for a project (update:task, update:job)
        cvat_webhook = cvat_api.create_cvat_webhook(cvat_project.id)

        with SessionLocal.begin() as session:
            total_jobs = len(self._job_layout)
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
                compose_bucket_url(
                    input_data_bucket.bucket_name,
                    bucket_host=input_data_bucket.host_url,
                    provider=input_data_bucket.provider,
                ),
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

            for job_filenames in self._job_layout:
                cvat_task = cvat_api.create_task(cvat_project.id, self.escrow_address)

                task_id = db_service.create_task(
                    session, cvat_task.id, cvat_project.id, TaskStatuses[cvat_task.status]
                )
                db_service.get_task_by_id(session, task_id, for_update=True)  # lock the row

                # Actual task creation in CVAT takes some time, so it's done in an async process.
                cvat_api.put_task_data(
                    cvat_task.id,
                    cvat_cloud_storage.id,
                    filenames=[
                        compose_data_bucket_filename(self.escrow_address, self.chain_id, fn)
                        for fn in job_filenames
                    ],
                    sort_images=False,
                )

                db_service.create_data_upload(session, cvat_task.id)

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

    def __init__(self, manifest: TaskManifest, escrow_address: str, chain_id: int):
        self.exit_stack = ExitStack()
        self.manifest = manifest
        self.escrow_address = escrow_address
        self.chain_id = chain_id

        self.logger: Logger = NullLogger()

        self._input_gt_data: _MaybeUnset[bytes] = _unset
        self._input_boxes_data: _MaybeUnset[bytes] = _unset

        self._data_filenames: _MaybeUnset[Sequence[str]] = _unset
        self._input_gt_dataset: _MaybeUnset[dm.Dataset] = _unset
        self._gt_dataset: _MaybeUnset[dm.Dataset] = _unset
        self._boxes_dataset: _MaybeUnset[dm.Dataset] = _unset

        self._skeleton_bbox_mapping: _MaybeUnset[
            skeletons_from_boxes_task.SkeletonBboxMapping
        ] = _unset
        self._roi_infos: _MaybeUnset[skeletons_from_boxes_task.RoiInfos] = _unset
        self._roi_filenames: _MaybeUnset[Dict[int, str]] = _unset
        self._job_params: _MaybeUnset[List[self._JobParams]] = _unset

        self._excluded_gt_info: _MaybeUnset[_ExcludedAnnotationsInfo] = _unset
        self._excluded_boxes_info: _MaybeUnset[_ExcludedAnnotationsInfo] = _unset

        # Configuration / constants
        self.job_size_mult = skeletons_from_boxes_task.DEFAULT_ASSIGNMENT_SIZE_MULTIPLIER
        "Job size multiplier"

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

        self.boxes_format = "coco_instances"

        self.embed_bbox_in_roi_image = True
        "Put a bbox into the extracted skeleton RoI images"

        self.embed_tile_border = True

        self.roi_embedded_bbox_color = (0, 255, 255)  # BGR
        self.roi_background_color = (245, 240, 242)  # BGR - CVAT background color

        self.oracle_data_bucket = BucketAccessInfo.parse_obj(Config.storage_config)

        self.min_label_gt_samples = 2  # TODO: find good threshold

        self.max_discarded_threshold = 0.5
        """
        The maximum allowed percent of discarded
        GT annotations or samples for successful job launch
        """

        # TODO: probably, need to also add an absolute number of minimum GT RoIs per class

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
        assert self._input_gt_data is not _unset

        self._input_gt_dataset = self._parse_dataset(
            self._input_gt_data,
            dataset_format=DM_GT_DATASET_FORMAT_MAPPING[self.manifest.annotation.type],
        )

    def _parse_boxes(self):
        assert self._input_boxes_data is not _unset

        self._boxes_dataset = self._parse_dataset(
            self._input_boxes_data, dataset_format=self.boxes_format
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

        # Reorder labels to match the manifest
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
                    self._format_list(extra_gt)
                )
            )

        if len(gt_filenames) < self.manifest.validation.val_size:
            raise TooFewSamples(
                f"Too few validation samples provided ({len(gt_filenames)}), "
                f"at least {self.manifest.validation.val_size} required."
            )

    def _validate_gt_annotations(self):
        def _validate_skeleton(skeleton: dm.Skeleton, *, sample_bbox: dm.Bbox):
            if skeleton.id in visited_ids:
                raise DatasetValidationError(f"repeated annotation id {skeleton.id}")

            if all(
                v == dm.Points.Visibility.absent for p in skeleton.elements for v in p.visibility
            ):
                # Handle fully absent skeletons
                # It's not the same as with all occluded points
                raise InvisibleSkeletonError("no visible points")

            for element in skeleton.elements:
                # This is what Datumaro is expected to parse
                assert len(element.points) == 2 and len(element.visibility) == 1

                if element.visibility[0] != dm.Points.Visibility.visible:
                    continue

                px, py = element.points[:2]
                if not is_point_in_bbox(int(px), int(py), sample_bbox):
                    raise InvalidCoordinates("skeleton point is outside the image")

        label_cat: dm.LabelCategories = self._input_gt_dataset.categories()[dm.AnnotationType.label]

        excluded_gt_info = _ExcludedAnnotationsInfo()
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
                    self._format_list(
                        [e.message for e in excluded_gt_info.messages], separator="\n"
                    )
                )
            )

        if excluded_gt_info.excluded_count > ceil(
            excluded_gt_info.total_count * self.max_discarded_threshold
        ):
            raise TooFewSamples(
                "Too many GT skeletons discarded, canceling job creation. Errors: {}".format(
                    self._format_list(
                        [error_info.message for error_info in excluded_gt_info.messages]
                    )
                )
            )

        self._excluded_gt_info = excluded_gt_info

    def _validate_gt(self):
        assert self._data_filenames is not _unset
        assert self._input_gt_dataset is not _unset

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
                    self._format_list(extra_bbox_samples),
                )
            )

    def _validate_boxes_annotations(self):
        # Convert possible polygons and masks into boxes
        self._boxes_dataset.transform(InstanceSegmentsToBbox)
        self._boxes_dataset.init_cache()

        excluded_boxes_info = _ExcludedAnnotationsInfo()

        label_cat: dm.LabelCategories = self._boxes_dataset.categories()[dm.AnnotationType.label]

        visited_ids = set()
        for sample in self._boxes_dataset:
            # Could fail on this as well
            image_h, image_w = sample.media_as(dm.Image).size

            sample_boxes = [a for a in sample.annotations if isinstance(a, dm.Bbox)]
            valid_boxes = []
            for bbox in sample_boxes:
                if not (
                    (0 <= int(bbox.x) < int(bbox.x + bbox.w) <= image_w)
                    and (0 <= int(bbox.y) < int(bbox.y + bbox.h) <= image_h)
                ):
                    excluded_boxes_info.add_message(
                        "Sample '{}': bbox #{} ({}) skipped - invalid coordinates".format(
                            sample.id, bbox.id, label_cat[bbox.label].name
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

                valid_boxes.append(bbox)
                visited_ids.add(bbox.id)

            excluded_boxes_info.excluded_count += len(sample_boxes) - len(valid_boxes)
            excluded_boxes_info.total_count += len(sample_boxes)

            if len(valid_boxes) != len(sample.annotations):
                self._boxes_dataset.put(sample.wrap(annotations=valid_boxes))

        if excluded_boxes_info.excluded_count > ceil(
            excluded_boxes_info.total_count * self.max_discarded_threshold
        ):
            raise TooFewSamples(
                "Too many boxes discarded, canceling job creation. Errors: {}".format(
                    self._format_list(
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
                    self._format_list(
                        [e.message for e in excluded_boxes_info.messages], separator="\n"
                    )
                )
            )

        self._excluded_boxes_info = excluded_boxes_info

    def _validate_boxes(self):
        assert self._data_filenames is not _unset
        assert self._boxes_dataset is not _unset

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
            f" (and {remainder_count} more)" if remainder_count > 0 else "",
        )

    def _match_boxes(self, a: BboxCoords, b: BboxCoords):
        return bbox_iou(a, b) > 0

    def _prepare_gt(self):
        def _find_unambiguous_matches(
            input_boxes: List[dm.Bbox],
            gt_skeletons: List[dm.Skeleton],
        ) -> List[Tuple[dm.Bbox, dm.Skeleton]]:
            matches = [
                [
                    (input_bbox.label == gt_skeleton.label)
                    and (self._match_boxes(input_bbox.get_bbox(), gt_skeleton.get_bbox()))
                    for gt_skeleton in gt_skeletons
                ]
                for input_bbox in input_boxes
            ]

            ambiguous_boxes: list[int] = set()
            ambiguous_skeletons: list[int] = set()
            for bbox_idx, input_bbox in enumerate(input_boxes):
                matched_skeletons: List[dm.Skeleton] = [
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
                            self._format_list([f"#{a.id}" for a in matched_skeletons]),
                        ),
                        sample_id=boxes_sample.id,
                        sample_subset=boxes_sample.subset,
                    )
                    # not an error, should not be counted as excluded for an error
                    ambiguous_boxes.add(input_bbox.id)
                    ambiguous_skeletons.update(s.id for s in matched_skeletons)
                    continue

            for skeleton_idx, gt_skeleton in enumerate(gt_skeletons):
                matched_boxes: List[dm.Bbox] = [
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
                            self._format_list([f"#{a.id}" for a in matched_boxes]),
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    # not an error, should not be counted as excluded for an error
                    ambiguous_skeletons.add(gt_skeleton.id)
                    ambiguous_boxes.update(b.id for b in matched_boxes)
                    continue
                elif not matched_boxes:
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

            unambiguous_matches: List[Tuple[dm.Bbox, dm.Skeleton]] = []
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
            input_boxes: List[dm.Bbox], gt_skeletons: List[dm.Skeleton]
        ) -> List[dm.Bbox]:
            matches = _find_unambiguous_matches(input_boxes, gt_skeletons)

            matched_skeletons = []
            for input_bbox, gt_skeleton in matches:
                if all(
                    v != dm.Points.Visibility.visible
                    for p in gt_skeleton.elements
                    for v in p.visibility
                ):
                    # Handle skeletons without visible points
                    excluded_gt_info.add_message(
                        "Sample '{}': GT skeleton #{} ({}) skipped - "
                        "no visible points".format(
                            gt_sample.id, gt_skeleton.id, gt_label_cat[gt_skeleton.label].name
                        ),
                        sample_id=gt_sample.id,
                        sample_subset=gt_sample.subset,
                    )
                    # not an error, should not be counted as excluded for an error
                    # we skip it as we can't reliably annotate and validate occluded now.
                    # TODO: figure out how to handle this, specifically is how to validate
                    continue

                gt_count_per_class[gt_skeleton.label] = (
                    gt_count_per_class.get(gt_skeleton.label, 0) + 1
                )

                matched_skeletons.append(gt_skeleton)
                skeleton_bbox_mapping[gt_skeleton.id] = input_bbox.id

            return matched_skeletons

        assert self._data_filenames is not _unset
        assert self._boxes_dataset is not _unset
        assert self._input_gt_dataset is not _unset
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

        excluded_boxes_info = _ExcludedAnnotationsInfo()  # local for the function
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

            # Samples without boxes are allowed, so we just skip them without an error
            if not gt_skeletons:
                continue

            matched_skeletons = _find_good_gt_skeletons(input_boxes, gt_skeletons)
            if not matched_skeletons:
                continue

            updated_gt_dataset.put(gt_sample.wrap(annotations=matched_skeletons))

        if excluded_boxes_info.messages:
            self.logger.warning(
                "Some boxes were excluded from GT due to the problems found: {}".format(
                    self._format_list(
                        [e.message for e in excluded_boxes_info.messages], separator="\n"
                    )
                )
            )

        if excluded_gt_info.messages:
            self.logger.warning(
                "Some GT annotations were excluded due to the errors found: {}".format(
                    self._format_list(
                        [e.message for e in excluded_gt_info.messages], separator="\n"
                    )
                )
            )

        if excluded_gt_info.excluded_count > ceil(
            self.max_discarded_threshold * excluded_gt_info.total_count
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
                self._format_list(
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
            if label_count < self.min_label_gt_samples
        ]
        if labels_with_few_gt:
            raise DatasetValidationError(
                "Too few matching GT boxes/points annotations found for some classes: {}".format(
                    self._format_list(labels_with_few_gt)
                )
            )

        self._gt_dataset = updated_gt_dataset
        self._skeleton_bbox_mapping = skeleton_bbox_mapping

    def _prepare_roi_infos(self):
        assert self._gt_dataset is not _unset
        assert self._boxes_dataset is not _unset

        rois: List[skeletons_from_boxes_task.RoiInfo] = []
        for sample in self._boxes_dataset:
            for bbox in sample.annotations:
                if not isinstance(bbox, dm.Bbox):
                    continue

                # RoI is centered on bbox center
                original_bbox_cx = int(bbox.x + bbox.w / 2)
                original_bbox_cy = int(bbox.y + bbox.h / 2)

                roi_w = ceil(bbox.w * self.roi_size_mult)
                roi_h = ceil(bbox.h * self.roi_size_mult)
                roi_w = max(roi_w, self.min_roi_size[0])
                roi_h = max(roi_h, self.min_roi_size[1])

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
                        roi_x=roi_x,
                        roi_y=roi_y,
                        roi_w=roi_w,
                        roi_h=roi_h,
                    )
                )

        self._roi_infos = rois

    def _mangle_filenames(self):
        """
        Mangle filenames in the dataset to make them less recognizable by annotators
        and hide private dataset info
        """
        assert self._roi_infos is not _unset

        # TODO: maybe add different names for the same GT images in
        # different jobs to make them even less recognizable
        self._roi_filenames = {
            roi_info.bbox_id: str(uuid.uuid4()) + self.roi_file_ext for roi_info in self._roi_infos
        }

    def _prepare_job_params(self):
        assert self._roi_infos is not _unset
        assert self._skeleton_bbox_mapping is not _unset
        assert self._input_gt_dataset is not _unset

        # This list can be different from what is selected for validation
        input_gt_filenames = set(sample.media.path for sample in self._input_gt_dataset)
        image_id_to_filename = {
            sample.attributes["id"]: sample.media.path for sample in self._boxes_dataset
        }

        # Make job layouts wrt. manifest params
        # 1 job per task, 1 task for each point label
        #
        # Unlike other task types, here we use a grid of RoIs,
        # so the absolute job size numbers from manifest are multiplied by the job size multiplier.
        # Then, we add a percent of job tiles for validation, keeping the requested ratio.
        gt_ratio = self.manifest.validation.val_size / (self.manifest.annotation.job_size or 1)
        job_size_mult = self.job_size_mult

        job_params: List[self._JobParams] = []

        roi_info_by_id = {roi_info.bbox_id: roi_info for roi_info in self._roi_infos}
        for label_id, _ in enumerate(self.manifest.annotation.labels):
            label_gt_roi_ids = set(
                roi_id
                for roi_id in self._skeleton_bbox_mapping.values()
                if roi_info_by_id[roi_id].bbox_label == label_id
            )

            label_data_roi_ids = [
                roi_info.bbox_id
                for roi_info in self._roi_infos
                if roi_info.bbox_label == label_id
                if roi_info.bbox_id not in label_gt_roi_ids
                if image_id_to_filename[roi_info.original_image_key] not in input_gt_filenames
            ]
            random.shuffle(label_data_roi_ids)

            for job_data_roi_ids in take_by(
                label_data_roi_ids, int(job_size_mult * self.manifest.annotation.job_size)
            ):
                job_gt_count = max(
                    self.manifest.validation.val_size, int(gt_ratio * len(job_data_roi_ids))
                )
                job_gt_count = min(len(label_gt_roi_ids), job_gt_count)

                job_gt_roi_ids = random.sample(label_gt_roi_ids, k=job_gt_count)

                job_roi_ids = list(job_data_roi_ids) + list(job_gt_roi_ids)
                random.shuffle(job_roi_ids)

                job_params.append(self._JobParams(label_id=label_id, roi_ids=job_roi_ids))

        self._job_params = job_params

    def _prepare_job_labels(self):
        self.point_labels = {}

        for skeleton_label in self.manifest.annotation.labels:
            for point_name in skeleton_label.nodes:
                self.point_labels[(skeleton_label.name, point_name)] = point_name

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
            (serializer.serialize_point_labels(self.point_labels), layout.POINT_LABELS_FILENAME)
        )

        storage_client = self._make_cloud_storage_client(self.oracle_data_bucket)
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

    def _draw_roi_bbox(self, roi_image: np.ndarray, bbox: dm.Bbox) -> np.ndarray:
        roi_cy = roi_image.shape[0] // 2
        roi_cx = roi_image.shape[1] // 2
        return cv2.rectangle(
            roi_image,
            tuple(map(int, (roi_cx - bbox.w / 2, roi_cy - bbox.h / 2))),
            tuple(map(int, (roi_cx + bbox.w / 2, roi_cy + bbox.h / 2))),
            self.roi_embedded_bbox_color,
            2,  # TODO: maybe improve line thickness
            cv2.LINE_4,
        )

    def _extract_and_upload_rois(self):
        assert self._roi_filenames is not _unset
        assert self._roi_infos is not _unset

        src_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
        src_prefix = src_bucket.path
        dst_bucket = self.oracle_data_bucket

        src_client = self._make_cloud_storage_client(src_bucket)
        dst_client = self._make_cloud_storage_client(dst_bucket)

        image_id_to_filename = {
            sample.attributes["id"]: sample.image.path for sample in self._boxes_dataset
        }

        filename_to_sample = {sample.image.path: sample for sample in self._boxes_dataset}

        _roi_info_key = lambda e: e.original_image_key
        roi_info_by_image: Dict[str, Sequence[skeletons_from_boxes_task.RoiInfo]] = {
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

        for filename in self._data_filenames:
            image_roi_infos = roi_info_by_image.get(filename, [])
            if not image_roi_infos:
                continue

            image_bytes = src_client.download_file(os.path.join(src_prefix, filename))
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
                roi_pixels = self._extract_roi(image_pixels, roi_info)

                if self.embed_bbox_in_roi_image:
                    roi_pixels = self._draw_roi_bbox(roi_pixels, bbox_by_id[roi_info.bbox_id])

                filename = self._roi_filenames[roi_info.bbox_id]
                roi_bytes = encode_image(roi_pixels, os.path.splitext(filename)[-1])

                dst_client.create_file(
                    compose_data_bucket_filename(self.escrow_address, self.chain_id, filename),
                    data=roi_bytes,
                )

    def _create_on_cvat(self):
        assert self._job_params is not _unset
        assert self.point_labels is not _unset

        _job_params_label_key = lambda ts: ts.label_id
        jobs_by_skeleton_label = {
            skeleton_label_id: list(g)
            for skeleton_label_id, g in groupby(
                sorted(self._job_params, key=_job_params_label_key), key=_job_params_label_key
            )
        }

        label_specs_by_skeleton = {
            skeleton_label_id: [
                {
                    "name": self.point_labels[(skeleton_label.name, skeleton_point)],
                    "type": "points",
                }
                for skeleton_point in skeleton_label.nodes
            ]
            for skeleton_label_id, skeleton_label in enumerate(self.manifest.annotation.labels)
        }

        input_data_bucket = BucketAccessInfo.parse_obj(self.manifest.data.data_url)
        oracle_bucket = self.oracle_data_bucket

        # Register cloud storage on CVAT to pass user dataset
        cvat_cloud_storage = cvat_api.create_cloudstorage(
            **_make_cvat_cloud_storage_params(oracle_bucket)
        )

        total_jobs = sum(
            len(self.manifest.annotation.labels[jp.label_id].nodes) for jp in self._job_params
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

            for skeleton_label_id, skeleton_label_jobs in jobs_by_skeleton_label.items():
                # Each skeleton point uses the same file layout in jobs
                skeleton_label_filenames = []
                for skeleton_label_job in skeleton_label_jobs:
                    skeleton_label_filenames.append(
                        [
                            compose_data_bucket_filename(
                                self.escrow_address, self.chain_id, self._roi_filenames[roi_id]
                            )
                            for roi_id in skeleton_label_job.roi_ids
                        ]
                    )

                for point_label_spec in label_specs_by_skeleton[skeleton_label_id]:
                    # Create a project for each point label.
                    # CVAT doesn't support tasks with different labels in a project.
                    cvat_project = cvat_api.create_project(
                        name="{} ({} {})".format(
                            self.escrow_address,
                            self.manifest.annotation.labels[skeleton_label_id].name,
                            point_label_spec["name"],
                        ),
                        user_guide=self.manifest.annotation.user_guide,
                        labels=[point_label_spec],
                        # TODO: improve guide handling - split for different points
                    )

                    # Setup webhooks for a project (update:task, update:job)
                    cvat_webhook = cvat_api.create_cvat_webhook(cvat_project.id)

                    project_id = db_service.create_project(
                        session,
                        cvat_project.id,
                        cvat_cloud_storage.id,
                        self.manifest.annotation.type,
                        self.escrow_address,
                        self.chain_id,
                        compose_bucket_url(
                            input_data_bucket.bucket_name,
                            bucket_host=input_data_bucket.host_url,
                            provider=input_data_bucket.provider,
                        ),
                        cvat_webhook_id=cvat_webhook.id,
                    )

                    db_service.get_project_by_id(
                        session, project_id, for_update=True
                    )  # lock the row
                    db_service.add_project_images(
                        session,
                        cvat_project.id,
                        list(set(chain.from_iterable(skeleton_label_filenames))),
                    )

                    for point_label_filenames in skeleton_label_filenames:
                        cvat_task = cvat_api.create_task(cvat_project.id, name=cvat_project.name)

                        task_id = db_service.create_task(
                            session, cvat_task.id, cvat_project.id, TaskStatuses[cvat_task.status]
                        )
                        db_service.get_task_by_id(session, task_id, for_update=True)  # lock the row

                        # Actual task creation in CVAT takes some time, so it's done in an async process.
                        # The task is fully created once 'update:task' or 'update:job' webhook is received.
                        cvat_api.put_task_data(
                            cvat_task.id,
                            cvat_cloud_storage.id,
                            filenames=point_label_filenames,
                            sort_images=False,
                        )

                        db_service.create_data_upload(session, cvat_task.id)

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
        self._prepare_job_labels()

        # Data preparation
        self._extract_and_upload_rois()
        self._upload_task_meta()

        self._create_on_cvat()


def is_image(path: str) -> bool:
    trunk, ext = os.path.splitext(os.path.basename(path))
    return trunk and ext.lower() in IMAGE_EXTENSIONS


def filter_image_files(data_filenames: List[str]) -> List[str]:
    return list(fn for fn in data_filenames if is_image(fn))


def strip_bucket_prefix(data_filenames: List[str], prefix: str) -> List[str]:
    return list(os.path.relpath(fn, prefix) for fn in data_filenames)


def make_label_configuration(manifest: TaskManifest) -> List[dict]:
    return [
        {
            "name": label.name,
            "type": LABEL_TYPE_MAPPING[manifest.annotation.type].value,
        }
        for label in manifest.annotation.labels
    ]


def _make_cvat_cloud_storage_params(bucket_info: BucketAccessInfo) -> Dict:
    CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER = {
        CloudProviders.aws: "AWS_S3_BUCKET",
        CloudProviders.gcs: "GOOGLE_CLOUD_STORAGE",
    }

    params = {
        "provider": CLOUD_PROVIDER_TO_CVAT_CLOUD_PROVIDER[bucket_info.provider],
        "bucket_name": bucket_info.bucket_name,
        "bucket_host": bucket_info.host_url,
    }

    if bucket_info.credentials:
        params["credentials"] = bucket_info.credentials.to_dict()

    return params


def create_task(escrow_address: str, chain_id: int) -> None:
    logger = get_function_logger(module_logger)

    manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))

    if manifest.annotation.type in [
        TaskTypes.image_boxes,
        TaskTypes.image_points,
        TaskTypes.image_label_binary,
    ]:
        builder_type = SimpleTaskBuilder
    elif manifest.annotation.type in [TaskTypes.image_boxes_from_points]:
        builder_type = BoxesFromPointsTaskBuilder
    elif manifest.annotation.type in [TaskTypes.image_skeletons_from_boxes]:
        builder_type = SkeletonsFromBoxesTaskBuilder
    else:
        raise Exception(f"Unsupported task type {manifest.annotation.type}")

    with builder_type(manifest, escrow_address, chain_id) as task_builder:
        task_builder.set_logger(logger)
        task_builder.build()


def remove_task(escrow_address: str) -> None:
    with SessionLocal.begin() as session:
        project = db_service.get_project_by_escrow_address(session, escrow_address)
        if project is not None:
            if project.cvat_cloudstorage_id:
                cvat_api.delete_cloudstorage(project.cvat_cloudstorage_id)
            if project.cvat_id:
                cvat_api.delete_project(project.cvat_id)
            db_service.delete_project(session, project.id)
