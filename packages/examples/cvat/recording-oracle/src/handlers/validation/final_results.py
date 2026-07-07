from __future__ import annotations

import io
import os
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING

import datumaro as dm
import numpy as np

import src.services.validation as db_service
from src.core.manifest import get_manifest_task_type
from src.core.tasks import TaskTypes
from src.core.tasks.cvat_formats import DM_DATASET_FORMAT_MAPPING, DM_GT_DATASET_FORMAT_MAPPING
from src.core.validation_meta import JobMeta, ResultMeta, ValidationMeta
from src.core.validation_results import FinalResult
from src.db.utils import ForUpdateParams
from src.handlers.validation.common import UNKNOWN_QUALITY, _JobResults, _TaskHandler
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo
from src.utils.annotations import ProjectLabels
from src.utils.zip_archive import extract_zip_archive, write_dir_to_zip_archive

if TYPE_CHECKING:
    import logging

    from sqlalchemy.orm import Session

    from src.core.annotation_meta import AnnotationMeta
    from src.core.manifest import ManifestBase


class _TaskAnnotationMerger(_TaskHandler):
    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        manifest: ManifestBase,
        *,
        merged_annotations: io.IOBase,
    ) -> None:
        super().__init__(escrow_address=escrow_address, chain_id=chain_id, manifest=manifest)

        self._merged_annotations: io.IOBase = merged_annotations

        self._updated_merged_dataset_archive: io.IOBase | None = None

        self._temp_dir: Path | None = None
        self._input_gt_dataset: dm.Dataset | None = None

    def _parse_gt_dataset(self, gt_file_data: bytes) -> dm.Dataset:
        with TemporaryDirectory() as gt_temp_dir:
            gt_filename = os.path.join(gt_temp_dir, "gt_annotations.json")
            with open(gt_filename, "wb") as f:
                f.write(gt_file_data)

            gt_dataset = dm.Dataset.import_from(
                gt_filename,
                format=DM_GT_DATASET_FORMAT_MAPPING[get_manifest_task_type(self.manifest)],
            )

            gt_dataset.init_cache()

            return gt_dataset

    def _load_gt_dataset(self):
        input_gt_bucket = BucketAccessInfo.parse_obj(self.manifest.validation.gt_url)
        gt_bucket_client = make_cloud_client(input_gt_bucket)
        gt_data = gt_bucket_client.download_file(input_gt_bucket.path)
        self._input_gt_dataset = self._parse_gt_dataset(gt_data)

    def _restore_original_image_paths(self, merged_dataset: dm.Dataset) -> dm.Dataset:
        class RemoveCommonPrefix(dm.ItemTransform):
            def __init__(self, extractor: dm.IExtractor, *, prefix: str) -> None:
                super().__init__(extractor)
                self._prefix = prefix

            def transform_item(self, item: dm.DatasetItem) -> dm.DatasetItem:
                if item.id.startswith(self._prefix):
                    item = item.wrap(id=item.id[len(self._prefix) :])
                return item

        prefix = BucketAccessInfo.parse_obj(self.manifest.data.data_url).path.strip("/\\") + "/"

        # Remove prefixes if it can be done safely
        sample_ids = {sample.id for sample in merged_dataset}
        if all(
            sample_id.startswith(prefix) and (sample_id[len(prefix) :] not in sample_ids)
            for sample_id in sample_ids
        ):
            merged_dataset.transform(RemoveCommonPrefix, prefix=prefix)

        return merged_dataset

    def _prepare_merged_dataset(self):
        tempdir = self._require_field(self._temp_dir)
        manifest = self._require_field(self.manifest)
        merged_annotations = self._require_field(self._merged_annotations)
        input_gt_dataset = self._require_field(self._input_gt_dataset)

        merged_dataset_path = tempdir / "merged"
        merged_dataset_format = DM_DATASET_FORMAT_MAPPING[get_manifest_task_type(manifest)]
        extract_zip_archive(merged_annotations, merged_dataset_path)

        merged_dataset = dm.Dataset.import_from(
            os.fspath(merged_dataset_path), format=merged_dataset_format
        )
        self._restore_original_image_paths(merged_dataset)
        self._put_gt_into_merged_dataset(input_gt_dataset, merged_dataset, manifest=manifest)

        updated_merged_dataset_path = tempdir / "merged_updated"
        merged_dataset.export(
            updated_merged_dataset_path, merged_dataset_format, save_media=False, reindex=True
        )

        updated_merged_dataset_archive = io.BytesIO()
        write_dir_to_zip_archive(updated_merged_dataset_path, updated_merged_dataset_archive)
        updated_merged_dataset_archive.seek(0)

        self._updated_merged_dataset_archive = updated_merged_dataset_archive

    @classmethod
    def _put_gt_into_merged_dataset(
        cls, input_gt_dataset: dm.Dataset, merged_dataset: dm.Dataset, *, manifest: ManifestBase
    ) -> None:
        """
        Updates the merged dataset inplace, writing GT annotations corresponding to the task type.
        """

        match get_manifest_task_type(manifest):
            case TaskTypes.image_boxes.value | TaskTypes.image_polygons.value:
                merged_dataset.update(input_gt_dataset)
            case TaskTypes.image_points.value:
                merged_label_cat: dm.LabelCategories = merged_dataset.categories()[
                    dm.AnnotationType.label
                ]

                # we support no more than 1 label so far
                assert len(manifest.annotation.labels) == 1

                skeleton_label_id = next(
                    i for i, label in enumerate(merged_label_cat) if not label.parent
                )
                point_label_id = next(i for i, label in enumerate(merged_label_cat) if label.parent)

                for sample in input_gt_dataset:
                    annotations = [
                        dm.Skeleton(
                            elements=[
                                # Put a point in the center of each GT bbox
                                # Not ideal, but it's the target for now
                                dm.Points(
                                    [bbox.x + bbox.w / 2, bbox.y + bbox.h / 2],
                                    label=point_label_id,
                                    attributes=bbox.attributes,
                                )
                            ],
                            label=skeleton_label_id,
                        )
                        for bbox in sample.annotations
                        if isinstance(bbox, dm.Bbox)
                    ]
                    merged_dataset.put(sample.wrap(annotations=annotations))
            case TaskTypes.image_label_binary.value:
                merged_dataset.update(input_gt_dataset)
            case TaskTypes.image_boxes_from_points:
                merged_dataset.update(input_gt_dataset)
            case TaskTypes.image_skeletons_from_boxes:
                # The original behavior of project_labels is broken for skeletons
                input_gt_dataset = dm.Dataset(input_gt_dataset)
                input_gt_dataset = input_gt_dataset.transform(
                    ProjectLabels, dst_labels=merged_dataset.categories()[dm.AnnotationType.label]
                )
                merged_dataset.update(input_gt_dataset)
            case _:
                raise AssertionError(f"Unknown task type {get_manifest_task_type(manifest)}")

    def merge_results(self) -> io.IOBase:
        with TemporaryDirectory() as tempdir:
            self._temp_dir = Path(tempdir)

            self._load_gt_dataset()
            self._prepare_merged_dataset()

        return self._require_field(self._updated_merged_dataset_archive)


def process_final_results(
    session: Session,
    *,
    escrow_address: str,
    chain_id: int,
    meta: AnnotationMeta,
    merged_annotations: io.RawIOBase,
    manifest: ManifestBase,
    logger: logging.Logger,
) -> FinalResult:
    assert logger  # unused

    task = db_service.get_task_by_escrow_address(
        session,
        escrow_address,
        for_update=ForUpdateParams(
            nowait=True
        ),  # should not happen, but waiting should not block processing
    )
    if not task:
        raise AssertionError(f"Validation results for escrow {escrow_address} not found")

    merger = _TaskAnnotationMerger(
        escrow_address=escrow_address,
        chain_id=chain_id,
        manifest=manifest,
        merged_annotations=merged_annotations,
    )

    merged_annotations = merger.merge_results()

    job_final_result_ids: dict[str, str] = {}

    for job_meta in meta.jobs:
        job = db_service.get_job_by_cvat_id(session, job_meta.job_id)
        if not job:
            raise AssertionError(
                f"Can't find validation results for job " f"{job_meta.job_id} ({escrow_address=})"
            )

        assignment_validation_result = db_service.get_validation_result_by_assignment_id(
            session, job_meta.assignment_id
        )
        if not assignment_validation_result:
            raise AssertionError(
                f"Can't find validation results for assignments "
                f"{job_meta.assignment_id} ({escrow_address=})"
            )

        job_final_result_ids[job.id] = assignment_validation_result.id

    task_jobs = task.jobs

    task_validation_results = db_service.get_task_validation_results(session, task.id)

    job_id_to_meta_id = {job.id: i for i, job in enumerate(task_jobs)}

    validation_result_id_to_meta_id = {r.id: i for i, r in enumerate(task_validation_results)}

    validation_meta = ValidationMeta(
        jobs=[
            JobMeta(
                job_id=job_id_to_meta_id[job.id],
                final_result_id=validation_result_id_to_meta_id[job_final_result_ids[job.id]],
            )
            for job in task_jobs
        ],
        results=[
            ResultMeta(
                id=validation_result_id_to_meta_id[r.id],
                job_id=job_id_to_meta_id[r.job.id],
                annotator_wallet_address=r.annotator_wallet_address,
                annotation_quality=r.annotation_quality,
            )
            for r in task_validation_results
        ],
    )

    # Include final results for all jobs
    job_results: _JobResults = {
        job.cvat_id: task_validation_results[
            validation_result_id_to_meta_id[job_final_result_ids[job.id]]
        ].annotation_quality
        for job in task_jobs
    }

    return FinalResult(
        job_results=job_results,
        validation_meta=validation_meta,
        resulting_annotations=merged_annotations.read(),
        average_quality=np.mean(
            [v for v in job_results.values() if v != UNKNOWN_QUALITY and v >= 0] or [0]
        ),
    )
