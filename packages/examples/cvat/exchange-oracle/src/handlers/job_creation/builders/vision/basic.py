from __future__ import annotations

import math
import os
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING

import datumaro as dm
import numpy as np

import src.core.tasks.points as points_task
import src.core.tasks.simple as simple_task
import src.cvat.api_calls as cvat_api
import src.services.cloud as cloud_service
import src.services.cvat as db_service
from src.core.config import Config
from src.core.storage import compose_data_bucket_filename
from src.core.types import TaskStatuses
from src.db import SessionLocal
from src.models.cvat import Project
from src.services.cloud.utils import BucketAccessInfo
from src.utils.logging import format_sequence

if TYPE_CHECKING:
    from src.core.manifest.v1 import JobManifest

from src.core.tasks.cvat_formats import DM_GT_DATASET_FORMAT_MAPPING
from src.handlers.job_creation.builders.vision.base import TaskBuilderBase
from src.handlers.job_creation.exceptions import (
    DatasetValidationError,
    TooFewSamples,
)
from src.handlers.job_creation.utils import (
    MaybeUnset,
    filter_image_files,
    make_cvat_cloud_storage_params,
    make_label_configuration,
    unset,
)


class SimpleTaskBuilder(TaskBuilderBase):
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
        self, gt_dataset: dm.Dataset, data_filenames: list[str], *, manifest: JobManifest
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
        cloud_storage = cvat_api.create_cloudstorage(**make_cvat_cloud_storage_params(data_bucket))

        # Create a project
        cvat_project = cvat_api.create_project(
            escrow_address,
            labels=label_configuration,
            user_guide=manifest.annotation.user_guide,
        )

        # Setup webhooks for the project
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
    def __init__(self, manifest: JobManifest, escrow_address: str, chain_id: int) -> None:
        super().__init__(manifest=manifest, escrow_address=escrow_address, chain_id=chain_id)

        self._mean_gt_bbox_radius_estimation: MaybeUnset[float] = unset

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
            updated_anns = []
            if sample_points:
                updated_anns.append(dm.Points(sample_points, label=label_id))

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
        assert self._mean_gt_bbox_radius_estimation is not unset

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
