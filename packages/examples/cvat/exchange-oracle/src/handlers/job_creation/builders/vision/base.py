from __future__ import annotations

import random
from abc import ABCMeta, abstractmethod
from contextlib import ExitStack
from pathlib import Path
from tempfile import TemporaryDirectory
from time import sleep
from typing import TYPE_CHECKING

from datumaro.util import take_by

import src.cvat.api_calls as cvat_api
import src.services.cloud as cloud_service
from src.core.config import Config
from src.services.cloud import CloudProviders, StorageClient
from src.services.cloud.utils import BucketAccessInfo
from src.utils.logging import NullLogger
from src.utils.zip_archive import write_dir_to_zip_archive

if TYPE_CHECKING:
    from collections.abc import Generator
    from logging import Logger

    import datumaro as dm

    from src.core.manifest import ManifestBase


class TaskBuilderBase(metaclass=ABCMeta):
    def __init__(self, manifest: ManifestBase, escrow_address: str, chain_id: int) -> None:
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
