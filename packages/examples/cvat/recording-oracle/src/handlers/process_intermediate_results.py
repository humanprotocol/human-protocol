import io
import logging
import os
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Dict, List, Type, Union

import datumaro as dm
import numpy as np
from attrs import define
from sqlalchemy.orm import Session

import src.services.validation as db_service
from src.core.annotation_meta import AnnotationMeta
from src.core.manifest import TaskManifest
from src.core.types import TaskType
from src.core.validation_meta import JobMeta, ResultMeta, ValidationMeta
from src.utils.zip_archive import extract_zip_archive, write_dir_to_zip_archive
from src.validation.dataset_comparison import (
    BboxDatasetComparator,
    DatasetComparator,
    PointsDatasetComparator,
)


@define
class ValidationSuccess:
    validation_meta: ValidationMeta
    resulting_annotations: bytes
    average_quality: float


@define
class ValidationFailure:
    rejected_job_ids: List[int]


DM_DATASET_FORMAT_MAPPING = {
    TaskType.image_label_binary: "cvat_images",
    TaskType.image_points: "coco_person_keypoints",
    TaskType.image_boxes: "coco_instances",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    TaskType.image_label_binary: "cvat_images",
    TaskType.image_points: "coco_instances",  # we compare points against boxes
    TaskType.image_boxes: "coco_instances",
}


DATASET_COMPARATOR_TYPE_MAP: Dict[TaskType, Type[DatasetComparator]] = {
    # TaskType.image_label_binary: TagDatasetComparator, # TODO: implement if support is needed
    TaskType.image_boxes: BboxDatasetComparator,
    TaskType.image_points: PointsDatasetComparator,
}


def process_intermediate_results(
    session: Session,
    *,
    escrow_address: str,
    chain_id: int,
    meta: AnnotationMeta,
    job_annotations: Dict[int, io.RawIOBase],
    gt_annotations: io.RawIOBase,
    merged_annotations: io.RawIOBase,
    manifest: TaskManifest,
    logger: logging.Logger,
) -> Union[ValidationSuccess, ValidationFailure]:
    # validate
    task_type = manifest.annotation.type
    dataset_format = DM_DATASET_FORMAT_MAPPING[task_type]

    job_results: Dict[int, float] = {}
    rejected_job_ids: List[int] = []

    with TemporaryDirectory() as tempdir:
        tempdir = Path(tempdir)

        gt_dataset_path = tempdir / "gt.json"
        gt_dataset_path.write_bytes(gt_annotations.read())
        gt_dataset = dm.Dataset.import_from(
            os.fspath(gt_dataset_path), format=DM_GT_DATASET_FORMAT_MAPPING[task_type]
        )

        comparator = DATASET_COMPARATOR_TYPE_MAP[task_type](
            min_similarity_threshold=manifest.validation.min_quality
        )

        for job_cvat_id, job_annotations_file in job_annotations.items():
            job_dataset_path = tempdir / str(job_cvat_id)
            extract_zip_archive(job_annotations_file, job_dataset_path)

            job_dataset = dm.Dataset.import_from(os.fspath(job_dataset_path), format=dataset_format)

            job_mean_accuracy = comparator.compare(gt_dataset, job_dataset)
            job_results[job_cvat_id] = job_mean_accuracy

            if job_mean_accuracy < manifest.validation.min_quality:
                rejected_job_ids.append(job_cvat_id)

        merged_dataset_path = tempdir / str("merged")
        merged_dataset_format = DM_DATASET_FORMAT_MAPPING[task_type]
        extract_zip_archive(merged_annotations, merged_dataset_path)

        merged_dataset = dm.Dataset.import_from(
            os.fspath(merged_dataset_path), format=merged_dataset_format
        )
        put_gt_into_merged_dataset(gt_dataset, merged_dataset, manifest=manifest)

        updated_merged_dataset_path = tempdir / str("merged_updated")
        merged_dataset.export(updated_merged_dataset_path, merged_dataset_format, save_media=False)

        updated_merged_dataset_archive = io.BytesIO()
        write_dir_to_zip_archive(updated_merged_dataset_path, updated_merged_dataset_archive)
        updated_merged_dataset_archive.seek(0)

    if logger.isEnabledFor(logging.DEBUG):
        logger.debug(
            "Task validation results for escrow_address=%s: %s",
            escrow_address,
            ", ".join(f"{k}: {v:.2f}" for k, v in job_results.items()),
        )

    task = db_service.get_task_by_escrow_address(session, escrow_address)
    if not task:
        task_id = db_service.create_task(session, escrow_address=escrow_address, chain_id=chain_id)
        task = db_service.get_task_by_id(session, task_id)

    job_final_result_ids: Dict[int, str] = {}
    for job_meta in meta.jobs:
        job = db_service.get_job_by_cvat_id(session, job_meta.job_id)
        if not job:
            job_id = db_service.create_job(session, task_id=task.id, job_cvat_id=job_meta.job_id)
            job = db_service.get_job_by_id(session, job_id)

        validation_result = db_service.get_validation_result_by_assignment_id(
            session, job_meta.assignment_id
        )
        if not validation_result:
            validation_result_id = db_service.create_validation_result(
                session,
                job_id=job.id,
                annotator_wallet_address=job_meta.annotator_wallet_address,
                annotation_quality=job_results[job_meta.job_id],
                assignment_id=job_meta.assignment_id,
            )
        else:
            validation_result_id = validation_result.id

        job_final_result_ids[job.id] = validation_result_id

    if rejected_job_ids:
        return ValidationFailure(rejected_job_ids)

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

    return ValidationSuccess(
        validation_meta=validation_meta,
        resulting_annotations=updated_merged_dataset_archive.getvalue(),
        average_quality=np.mean(list(job_results.values())) if job_results else 0,
    )


def put_gt_into_merged_dataset(
    gt_dataset: dm.Dataset, merged_dataset: dm.Dataset, *, manifest: TaskManifest
):
    """
    Updates the merged dataset inplace, writing GT annotations corresponding to the task type.
    """

    match manifest.annotation.type:
        case TaskType.image_boxes.value:
            merged_dataset.update(gt_dataset)
        case TaskType.image_points.value:
            for sample in gt_dataset:
                annotations = [
                    # Put a point in the center of each GT bbox
                    # Not ideal, but it's the target for now
                    dm.Points(
                        [bbox.x + bbox.w / 2, bbox.y + bbox.h / 2],
                        label=bbox.label,
                        attributes=bbox.attributes,
                    )
                    for bbox in sample.annotations
                    if isinstance(bbox, dm.Bbox)
                ]
                merged_dataset.put(sample.wrap(annotations=annotations))
        case TaskType.image_label_binary.value:
            merged_dataset.update(gt_dataset)
        case _:
            assert False, f"Unknown task type {manifest.annotation.type}"


def parse_annotation_metafile(metafile: io.RawIOBase) -> AnnotationMeta:
    return AnnotationMeta.parse_raw(metafile.read())


def serialize_validation_meta(validation_meta: ValidationMeta) -> bytes:
    return validation_meta.json().encode()
