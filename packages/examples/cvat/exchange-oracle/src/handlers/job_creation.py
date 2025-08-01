from __future__ import annotations

import math
import os
import random
import uuid
from abc import ABCMeta, abstractmethod
from concurrent.futures import Future, ThreadPoolExecutor
from contextlib import ExitStack
from dataclasses import dataclass, field
from itertools import chain, groupby
from math import ceil
from pathlib import Path
from queue import Queue
from tempfile import TemporaryDirectory
from time import sleep
from typing import TYPE_CHECKING, TypeVar, cast

import cv2
import datumaro as dm
import numpy as np
from datumaro.util import filter_dict, take_by
from datumaro.util.annotation_util import BboxCoords, bbox_iou, find_instances
from datumaro.util.image import IMAGE_EXTENSIONS, decode_image, encode_image

import src.core.tasks.boxes_from_points as boxes_from_points_task
import src.core.tasks.points as points_task
import src.core.tasks.simple as simple_task
import src.core.tasks.skeletons_from_boxes as skeletons_from_boxes_task
import src.cvat.api_calls as cvat_api
import src.services.cloud as cloud_service
import src.services.cvat as db_service
from src.chain.escrow import get_escrow_manifest
from src.core.config import Config
from src.core.storage import compose_data_bucket_filename, compose_data_bucket_prefix
from src.core.types import TaskStatuses, TaskTypes
from src.db import SessionLocal
from src.log import ROOT_LOGGER_NAME
from src.models.cvat import Project
from src.services.cloud import CloudProviders, StorageClient
from src.services.cloud.utils import BucketAccessInfo
from src.utils.annotations import InstanceSegmentsToBbox, ProjectLabels, is_point_in_bbox
from src.utils.assignments import parse_manifest
from src.utils.logging import NullLogger, format_sequence, get_function_logger
from src.utils.roi_uploader import BufferedRoiImageUploader
from src.utils.zip_archive import write_dir_to_zip_archive

if TYPE_CHECKING:
    from collections.abc import Generator, Sequence
    from logging import Logger

    from src.core.manifest import TaskManifest

module_logger = f"{ROOT_LOGGER_NAME}.cron.cvat"

LABEL_TYPE_MAPPING = {
    TaskTypes.image_label_binary: cvat_api.LabelType.tag,
    TaskTypes.image_points: cvat_api.LabelType.points,
    TaskTypes.image_boxes: cvat_api.LabelType.rectangle,
    TaskTypes.image_polygons: cvat_api.LabelType.polygon,
    TaskTypes.image_boxes_from_points: cvat_api.LabelType.rectangle,
    TaskTypes.image_skeletons_from_boxes: cvat_api.LabelType.points,
}

DM_DATASET_FORMAT_MAPPING = {
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_points: "coco_person_keypoints",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_polygons: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    # GT uses the same format both for boxes and points
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_points: "coco_instances",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_polygons: "coco_instances",
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

_MaybeUnset = T | _Undefined


@dataclass
class _ExcludedAnnotationInfo:
    message: str
    sample_id: str = field(kw_only=True)
    sample_subset: str = field(kw_only=True)


@dataclass
class _ExcludedAnnotationsInfo:
    messages: list[_ExcludedAnnotationInfo] = field(default_factory=list)

    excluded_count: int = 0
    "The number of excluded annotations. Can be different from len(messages)"

    total_count: int = 0

    def add_message(self, message: str, *, sample_id: str, sample_subset: str):
        self.messages.append(
            _ExcludedAnnotationInfo(
                message=message, sample_id=sample_id, sample_subset=sample_subset
            )
        )


class _TaskBuilderBase(metaclass=ABCMeta):
    def __init__(self, manifest: TaskManifest, escrow_address: str, chain_id: int) -> None:
        self.exit_stack = ExitStack()
        self.manifest = manifest
        self.escrow_address = escrow_address
        self.chain_id = chain_id

        self.logger: Logger = NullLogger()

        self._oracle_data_bucket = BucketAccessInfo.parse_obj(Config.storage_config)

    @property
    def _task_segment_size(self) -> int:
        return self.manifest.annotation.job_size

    @property
    def _job_val_frames_count(self) -> int:
        return self.manifest.validation.val_size

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

    @classmethod
    def _make_cloud_storage_client(cls, bucket_info: BucketAccessInfo) -> StorageClient:
        extra_args = {}

        if bucket_info.provider == CloudProviders.aws:
            import boto3.session

            extra_args["config"] = boto3.session.Config(
                max_pool_connections=Config.features.max_data_storage_connections
            )
        elif bucket_info.provider == CloudProviders.gcs:
            pass  # TODO: test and add connections if needed

        return cloud_service.make_client(bucket_info, **extra_args)

    def _save_cvat_gt_dataset_to_oracle_bucket(  # noqa: B027
        self,
        gt_dataset_path: Path,
        *,
        file_suffix: str = "",
    ) -> None:
        # method saves gt annotations that will be uploaded to CVAT
        # into oracle bucket
        pass

    def _wait_task_creation(self, task_id: int) -> cvat_api.RequestStatus:
        # TODO: add a timeout or
        # save gt datasets in the oracle bucket and upload in track_task_creation()
        while True:
            task_status, _ = cvat_api.get_task_upload_status(task_id)
            if task_status not in [cvat_api.RequestStatus.STARTED, cvat_api.RequestStatus.QUEUED]:
                return task_status

            sleep(Config.cvat_config.task_creation_check_interval)

    def _setup_gt_job_for_cvat_task(
        self, task_id: int, gt_dataset: dm.Dataset, *, dm_export_format: str = "coco"
    ) -> None:
        task_status = self._wait_task_creation(task_id)
        if task_status != cvat_api.RequestStatus.FINISHED:
            return  # will be handled in state_trackers.py::track_task_creation

        dm_format_to_cvat_format = {
            "coco": "COCO 1.0",
            "cvat": "CVAT 1.1",
            "datumaro": "Datumaro 1.0",
        }

        with TemporaryDirectory() as tmp_dir:
            export_dir = Path(tmp_dir) / "export"
            gt_dataset.export(save_dir=str(export_dir), save_media=False, format=dm_export_format)

            annotations_archive_path = Path(tmp_dir) / "annotations.zip"
            with annotations_archive_path.open("wb") as annotations_archive:
                write_dir_to_zip_archive(export_dir, annotations_archive)

            if Config.is_development_mode():
                self._save_cvat_gt_dataset_to_oracle_bucket(
                    gt_dataset_path=annotations_archive_path, file_suffix=f"for_task_{task_id}"
                )

            self._setup_gt_job(
                task_id,
                annotations_archive_path,
                format_name=dm_format_to_cvat_format[dm_export_format],
            )

    def _setup_gt_job(self, task_id: int, dataset_path: Path, format_name: str) -> None:
        gt_job = cvat_api.get_gt_job(task_id)
        cvat_api.upload_gt_annotations(gt_job.id, dataset_path, format_name=format_name)
        cvat_api.finish_gt_job(gt_job.id)

    def _setup_quality_settings(self, task_id: int, **overrides) -> None:
        settings = cvat_api.get_quality_control_settings(task_id)

        values = {
            "target_metric_threshold": self.manifest.validation.min_quality,
            "empty_is_annotated": True,
        }
        values.update(**overrides)
        cvat_api.update_quality_control_settings(settings.id, **values)

    def _split_dataset_per_task(
        self,
        data_filenames: list[str],
        *,
        subset_size: int,
    ) -> Generator[str]:
        random.shuffle(data_filenames)
        yield from take_by(data_filenames, subset_size)

    @abstractmethod
    def build(self) -> None: ...


class SimpleTaskBuilder(_TaskBuilderBase):
    """
    Handles task creation for the IMAGE_BOXES task type
    """

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
        self, gt_file_data: bytes, *, add_prefix: str | None = None
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
        self, gt_dataset: dm.Dataset, data_filenames: list[str], *, manifest: TaskManifest
    ) -> list[str]:
        gt_filenames = set(s.id + s.media.ext for s in gt_dataset)
        known_data_filenames = set(data_filenames)
        matched_gt_filenames = gt_filenames.intersection(known_data_filenames)

        if len(gt_filenames) != len(matched_gt_filenames):
            missing_gt = gt_filenames - matched_gt_filenames
            raise DatasetValidationError(
                "Failed to find several validation samples in the dataset files: {}".format(
                    format_sequence(list(missing_gt))
                )
            )

        if len(gt_filenames) < manifest.validation.val_size:
            raise TooFewSamples(
                f"Too few validation samples provided ({len(gt_filenames)}), "
                f"at least {manifest.validation.val_size} required."
            )

        return list(matched_gt_filenames)

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
        data_to_be_annotated = [f for f in data_filenames if f not in set(gt_filenames)]
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
            segment_size = self._task_segment_size
            total_jobs = math.ceil(len(data_to_be_annotated) / segment_size)

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
                data_bucket.to_url(),
                cvat_webhook_id=cvat_webhook.id,
            )

            db_service.get_project_by_id(session, project_id, for_update=True)  # lock the row
            db_service.add_project_images(session, cvat_project.id, data_filenames)

            for data_subset in self._split_dataset_per_task(
                data_to_be_annotated,
                subset_size=Config.cvat_config.max_jobs_per_task * segment_size,
            ):
                cvat_task = cvat_api.create_task(
                    cvat_project.id, escrow_address, segment_size=segment_size
                )
                task_id = db_service.create_task(
                    session, cvat_task.id, cvat_project.id, TaskStatuses[cvat_task.status]
                )
                db_service.get_task_by_id(session, task_id, for_update=True)  # lock the row

                # The task is fully created once 'update:task' webhook is received.
                cvat_api.put_task_data(
                    cvat_task.id,
                    cloud_storage.id,
                    filenames=data_subset,
                    validation_params={
                        "gt_filenames": gt_filenames,  # include whole GT dataset into each task
                        "gt_frames_per_job_count": self._job_val_frames_count,
                    },
                )

                self._setup_gt_job_for_cvat_task(cvat_task.id, gt_dataset)
                self._setup_quality_settings(cvat_task.id)

                db_service.create_data_upload(session, cvat_task.id)
            db_service.touch(session, Project, [project_id])


class PointsTaskBuilder(SimpleTaskBuilder):
    def __init__(self, manifest: TaskManifest, escrow_address: str, chain_id: int) -> None:
        super().__init__(manifest=manifest, escrow_address=escrow_address, chain_id=chain_id)

        self._mean_gt_bbox_radius_estimation: _MaybeUnset[float] = _unset

    def _parse_gt_dataset(self, gt_file_data, *, add_prefix=None):
        gt_dataset = super()._parse_gt_dataset(gt_file_data, add_prefix=add_prefix)

        assert len(gt_dataset.categories()[dm.AnnotationType.label]) == 1
        label_id = 0

        updated_gt_dataset = dm.Dataset(categories=gt_dataset.categories(), media_type=dm.Image)

        # Replace boxes with their center points
        # Collect radius statistics
        radiuses = []
        for gt_sample in gt_dataset:
            image_size = gt_sample.media_as(dm.Image).size
            image_half_diag = ((image_size[0] ** 2 + image_size[1] ** 2) ** 0.5) / 2

            sample_points = []
            for gt_bbox in gt_sample.annotations:
                if not isinstance(gt_bbox, dm.Bbox):
                    continue

                x, y, w, h = gt_bbox.get_bbox()
                bbox_center = dm.Points([x + w / 2, y + h / 2], label=gt_bbox.label, id=gt_bbox.id)

                rel_int_bbox_radius = min(w, h) / 2 / image_half_diag
                radiuses.append(rel_int_bbox_radius)

                sample_points.extend(bbox_center.points)

            # Join points into a single annotation for compatibility with CVAT capabilities
            updated_anns = [dm.Points(sample_points, label=label_id)]

            updated_gt_dataset.put(gt_sample.wrap(annotations=updated_anns))

        self._mean_gt_bbox_radius_estimation = min(0.5, np.mean(radiuses).item())

        return updated_gt_dataset

    def _upload_task_meta(self, gt_dataset: dm.Dataset):
        layout = points_task.TaskMetaLayout()
        serializer = points_task.TaskMetaSerializer()

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

    def _setup_gt_job_for_cvat_task(
        self, task_id: int, gt_dataset: dm.Dataset, *, dm_export_format: str = "datumaro"
    ) -> None:
        super()._setup_gt_job_for_cvat_task(
            task_id=task_id, gt_dataset=gt_dataset, dm_export_format=dm_export_format
        )

    def _setup_quality_settings(self, task_id: int, **overrides) -> None:
        assert self._mean_gt_bbox_radius_estimation is not _unset

        values = {
            # We have at most 1 annotation per frame, so accuracy on each frame is either 0 or 1,
            # regardless of the points count. For job accuracy we'll have:
            # quality = mean frame accuracy = count of correct frames / validation frame count.
            # If we set quality threshold from the manifest on this value, it can break quality
            # requirements.
            # Example: target quality is 80%, 6 frames, 1 has 20 points, 5 others have 1.
            # Suppose the 5 frames with 1 point are annotated correctly and
            # the one with 20 - is not annotated. The mean frame accuracy will be 5 / 6 ~ 83%,
            # which is higher than the target quality, so the job will be accepted.
            # The per-point mean (aka micro) accuracy will be 5 / (20 + 5) = 20%.
            #
            # Instead, we require that each frame matches with the required quality threshold,
            # so the job accuracy is 1. This is a more strict requirement, from which
            # follows that the job quality >= required.
            # For each frame, as we have just 1 annotation, quality is computed as mean
            # point quality on the frame with frame matching threshold.
            # Point set accuracy is controlled by iou_threshold,
            # so configure it with the requested quality value.
            #
            # TODO: consider adding a quality option to count points as separate,
            # or implement and use the mean IoU as the target metric in CVAT.
            "target_metric_threshold": 0.95,  # some big number close to 1
            "iou_threshold": self.manifest.validation.min_quality,
            "oks_sigma": self._mean_gt_bbox_radius_estimation,
            "point_size_base": "image_size",
        }
        values.update(overrides)
        super()._setup_quality_settings(task_id, **values)

    def build(self):
        if len(self.manifest.annotation.labels) != 1:
            # TODO: implement support for multiple labels
            # Probably, need to split the whole task into projects per label
            # for efficient annotation
            raise NotImplementedError("Point annotation tasks can have only 1 label")

        return super().build()


class PolygonTaskBuilder(SimpleTaskBuilder):
    def _setup_quality_settings(self, task_id: int, **overrides) -> None:
        values = {"iou_threshold": Config.cvat_config.iou_threshold, **overrides}
        super()._setup_quality_settings(task_id, **values)


class BoxesFromPointsTaskBuilder(_TaskBuilderBase):
    def __init__(self, manifest: TaskManifest, escrow_address: str, chain_id: int) -> None:
        super().__init__(manifest=manifest, escrow_address=escrow_address, chain_id=chain_id)

        self._input_gt_data: _MaybeUnset[bytes] = _unset
        self._input_points_data: _MaybeUnset[bytes] = _unset

        self._data_filenames: _MaybeUnset[Sequence[str]] = _unset
        self._input_gt_dataset: _MaybeUnset[dm.Dataset] = _unset
        self._gt_dataset: _MaybeUnset[dm.Dataset] = _unset
        self._gt_roi_dataset: _MaybeUnset[dm.Dataset] = _unset
        self._points_dataset: _MaybeUnset[dm.Dataset] = _unset

        self._bbox_point_mapping: _MaybeUnset[boxes_from_points_task.BboxPointMapping] = _unset
        "bbox_id -> point_id"

        self._roi_size_estimations: _MaybeUnset[dict[int, tuple[float, float]]] = _unset
        "label_id -> (rel. w, rel. h)"

        self._rois: _MaybeUnset[boxes_from_points_task.RoiInfos] = _unset
        self._roi_filenames: _MaybeUnset[boxes_from_points_task.RoiFilenames] = _unset
        self._roi_filenames_to_be_annotated: _MaybeUnset[Sequence[str]] = _unset
        self._gt_roi_filenames: _MaybeUnset[Sequence[str]] = _unset

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
        assert self._data_filenames is not _unset
        assert self._input_gt_dataset is not _unset

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
        assert self._gt_dataset is not _unset
        assert self._roi_size_estimations is not _unset
        assert self._points_dataset is not _unset

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
        assert self._rois is not _unset

        # TODO: maybe add different names for the same GT images in
        # different jobs to make them even less recognizable
        self._roi_filenames = {
            roi.point_id: str(uuid.uuid4()) + self.roi_file_ext for roi in self._rois
        }

    def _prepare_job_layout(self):
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
        self._gt_roi_filenames = [self._roi_filenames[point_id] for point_id in gt_point_ids]
        self._roi_filenames_to_be_annotated = [
            fn
            for point_id, fn in self._roi_filenames.items()
            if point_id not in gt_point_ids
            if original_image_id_to_filename[point_id_to_original_image_id[point_id]]
            not in input_gt_filenames
        ]

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
        return cv2.circle(
            roi_pixels,
            center,
            point_size,
            self.embedded_point_color,
            cv2.FILLED,
        )

    def _extract_and_upload_rois(self):
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
        assert self._roi_filenames_to_be_annotated is not _unset
        assert self._gt_roi_filenames is not _unset
        assert self._label_configuration is not _unset
        assert self._gt_roi_dataset is not _unset

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


class SkeletonsFromBoxesTaskBuilder(_TaskBuilderBase):
    @dataclass
    class _TaskParams:
        label_id: int
        roi_ids: list[int]
        roi_gt_ids: list[int]

    def __init__(self, manifest: TaskManifest, escrow_address: str, chain_id: int) -> None:
        super().__init__(manifest=manifest, escrow_address=escrow_address, chain_id=chain_id)

        self._input_gt_data: _MaybeUnset[bytes] = _unset
        self._input_boxes_data: _MaybeUnset[bytes] = _unset

        self._data_filenames: _MaybeUnset[Sequence[str]] = _unset
        self._input_gt_dataset: _MaybeUnset[dm.Dataset] = _unset
        self._gt_dataset: _MaybeUnset[dm.Dataset] = _unset
        self._boxes_dataset: _MaybeUnset[dm.Dataset] = _unset

        self._skeleton_bbox_mapping: _MaybeUnset[skeletons_from_boxes_task.SkeletonBboxMapping] = (
            _unset
        )
        self._roi_infos: _MaybeUnset[skeletons_from_boxes_task.RoiInfos] = _unset
        self._roi_info_by_id: _MaybeUnset[dict[int, skeletons_from_boxes_task.RoiInfo]] = _unset

        self._gt_points_per_label: _MaybeUnset[
            dict[tuple[int, str], Sequence[tuple[int, dm.Points]]]
        ] = _unset
        "(skeleton_label_id, point_label_name) to [(skeleton_id, point), ...]"

        self._roi_filenames: _MaybeUnset[dict[int, str]] = _unset

        self._task_params: _MaybeUnset[list[self._TaskParams]] = _unset

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

        self.boxes_format = "coco_person_keypoints"

        self.embed_bbox_in_roi_image = True
        "Put a bbox into the extracted skeleton RoI images"

        self.embed_tile_border = True

        self.embedded_point_radius = 15
        self.min_embedded_point_radius_percent = 0.005
        self.max_embedded_point_radius_percent = 0.01
        self.embedded_point_color = (0, 255, 255)

        self.roi_embedded_bbox_color = (0, 255, 255)  # BGR
        self.roi_background_color = (245, 240, 242)  # BGR - CVAT background color

        self.oracle_data_bucket = BucketAccessInfo.parse_obj(Config.storage_config)

        self.min_label_gt_samples = 2  # TODO: find good threshold

        self.max_discarded_threshold = 0.5
        """
        The maximum allowed percent of discarded
        GT annotations or samples for successful job launch
        """

        self.gt_id_attribute = "object_id"
        "An additional way to match GT skeletons with input boxes"

        # TODO: probably, need to also add an absolute number of minimum GT RoIs per class

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
                    format_sequence([e.message for e in excluded_gt_info.messages], separator="\n")
                )
            )

        if excluded_gt_info.excluded_count > ceil(
            excluded_gt_info.total_count * self.max_discarded_threshold
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
                    format_sequence(extra_bbox_samples),
                )
            )

    def _validate_boxes_annotations(self):  # noqa: PLR0912
        # Convert possible polygons and masks into boxes
        self._boxes_dataset.transform(InstanceSegmentsToBbox)
        self._boxes_dataset.init_cache()

        excluded_boxes_info = _ExcludedAnnotationsInfo()

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
            excluded_boxes_info.total_count * self.max_discarded_threshold
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
        assert self._data_filenames is not _unset
        assert self._boxes_dataset is not _unset

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
                        not (bbox_id := input_bbox.attributes.get(self.gt_id_attribute))
                        or not (skeleton_id := gt_skeleton.attributes.get(self.gt_id_attribute))
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
            if label_count < self.min_label_gt_samples
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
        assert self._gt_dataset is not _unset
        assert self._boxes_dataset is not _unset

        rois: list[skeletons_from_boxes_task.RoiInfo] = []
        for sample in self._boxes_dataset:
            instances = find_instances(sample.annotations)
            for instance_anns in instances:
                bbox = next(a for a in instance_anns if isinstance(a, dm.Bbox))
                point = next(a for a in instance_anns if isinstance(a, dm.Points))

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
        assert self._roi_infos is not _unset

        # TODO: maybe add different names for the same GT images in
        # different jobs to make them even less recognizable
        self._roi_filenames = {
            roi_info.bbox_id: str(uuid.uuid4()) + self.roi_file_ext for roi_info in self._roi_infos
        }

    @property
    def _task_segment_size(self) -> int:
        # Here we use a job size multiplier, because each image
        # is supposed to be simple and the assignment is expected
        # to take little time with the default job size.
        # Then, we add a percent of job tiles for validation, keeping the requested ratio.
        return super()._task_segment_size * self.job_size_mult

    @property
    def _job_val_frames_count(self) -> int:
        return super()._job_val_frames_count * self.job_size_mult

    def _prepare_task_params(self):
        assert self._roi_infos is not _unset
        assert self._skeleton_bbox_mapping is not _unset
        assert self._input_gt_dataset is not _unset

        # This list can be different from what is selected for validation
        input_gt_filenames = set(sample.media.path for sample in self._input_gt_dataset)
        image_id_to_filename = {
            sample.attributes["id"]: sample.media.path for sample in self._boxes_dataset
        }

        task_params: list[self._TaskParams] = []
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
                    self._TaskParams(
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
        assert self._gt_dataset is not _unset

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
            1,
            cv2.LINE_4,
        )

    def _draw_roi_point(self, roi_image: np.ndarray, point: tuple[float, float]) -> np.ndarray:
        roi_r = (roi_image.shape[0] ** 2 + roi_image.shape[1] ** 2) ** 0.5 / 2
        radius = int(
            min(
                self.max_embedded_point_radius_percent * roi_r,
                max(self.embedded_point_radius, self.min_embedded_point_radius_percent * roi_r),
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
            self.embedded_point_color,
            -1,
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

                if self.embed_bbox_in_roi_image:
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
        assert self._gt_points_per_label is not _unset

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
        assert self._task_params is not _unset
        assert self._point_labels is not _unset
        assert self._gt_points_per_label is not _unset

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

        oracle_bucket = self.oracle_data_bucket

        # Register cloud storage on CVAT to pass user dataset
        cvat_cloud_storage = cvat_api.create_cloudstorage(
            **_make_cvat_cloud_storage_params(oracle_bucket)
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

                    # Setup webhooks for a project (update:task, update:job)
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


def is_image(path: str) -> bool:
    trunk, ext = os.path.splitext(os.path.basename(path))
    return trunk and ext.lower() in IMAGE_EXTENSIONS


def filter_image_files(data_filenames: list[str]) -> list[str]:
    return [fn for fn in data_filenames if is_image(fn)]


def strip_bucket_prefix(data_filenames: list[str], prefix: str) -> list[str]:
    return [os.path.relpath(fn, prefix) for fn in data_filenames]


def make_label_configuration(manifest: TaskManifest) -> list[dict]:
    return [
        {
            "name": label.name,
            "type": LABEL_TYPE_MAPPING[manifest.annotation.type].value,
        }
        for label in manifest.annotation.labels
    ]


def _make_cvat_cloud_storage_params(bucket_info: BucketAccessInfo) -> dict:
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

    if manifest.annotation.type in [TaskTypes.image_boxes, TaskTypes.image_label_binary]:
        builder_type = SimpleTaskBuilder
    elif manifest.annotation.type is TaskTypes.image_polygons:
        builder_type = PolygonTaskBuilder
    elif manifest.annotation.type in [TaskTypes.image_points]:
        builder_type = PointsTaskBuilder
    elif manifest.annotation.type in [TaskTypes.image_boxes_from_points]:
        builder_type = BoxesFromPointsTaskBuilder
    elif manifest.annotation.type in [TaskTypes.image_skeletons_from_boxes]:
        builder_type = SkeletonsFromBoxesTaskBuilder
    else:
        raise Exception(f"Unsupported task type {manifest.annotation.type}")

    with builder_type(manifest, escrow_address, chain_id) as task_builder:
        task_builder.set_logger(logger)
        task_builder.build()
