import os
import random
from tempfile import TemporaryDirectory
from typing import List

import datumaro as dm
from datumaro.util import take_by
from datumaro.util.image import IMAGE_EXTENSIONS

import src.cvat.api_calls as cvat_api
import src.services.cloud as cloud_service
import src.services.cvat as db_service
from src.chain.escrow import get_escrow_manifest
from src.core.manifest import TaskManifest
from src.core.types import CvatLabelType, TaskStatus, TaskType
from src.db import SessionLocal
from src.utils.assignments import parse_manifest
from src.utils.cloud_storage import compose_bucket_url, parse_bucket_url

LABEL_TYPE_MAPPING = {
    TaskType.image_label_binary: CvatLabelType.tag,
    TaskType.image_points: CvatLabelType.points,
    TaskType.image_boxes: CvatLabelType.rectangle,
}

DM_DATASET_FORMAT_MAPPING = {
    TaskType.image_label_binary: "cvat_images",
    TaskType.image_points: "coco_person_keypoints",
    TaskType.image_boxes: "coco_instances",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    # GT uses the same format both for boxes and points
    TaskType.image_label_binary: "cvat_images",
    TaskType.image_points: "coco_instances",
    TaskType.image_boxes: "coco_instances",
}


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
        raise Exception(
            "Failed to find several validation samples in the dataset files: {}{}".format(
                ", ".join(missing_gt[:missing_gt_display_threshold]),
                f"(and {remainder} more)" if remainder else "",
            )
        )

    if len(gt_filenames) < manifest.validation.val_size:
        raise Exception(
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
            "type": LABEL_TYPE_MAPPING.get(manifest.annotation.type).value,
        }
        for label in manifest.annotation.labels
    ]


def create_task(escrow_address: str, chain_id: int) -> None:
    manifest = parse_manifest(get_escrow_manifest(chain_id, escrow_address))

    parsed_data_bucket_url = parse_bucket_url(manifest.data.data_url)
    data_cloud_provider = parsed_data_bucket_url.provider
    data_bucket_host = parsed_data_bucket_url.host_url
    data_bucket_name = parsed_data_bucket_url.bucket_name
    data_bucket_path = parsed_data_bucket_url.path

    # Validate and parse GT
    parsed_gt_bucket_url = parse_bucket_url(manifest.validation.gt_url)
    gt_bucket_host = parsed_gt_bucket_url.host_url
    gt_bucket_name = parsed_gt_bucket_url.bucket_name
    gt_filename = parsed_gt_bucket_url.path

    # Register cloud storage on CVAT to pass user dataset
    cloud_storage = cvat_api.create_cloudstorage(
        data_cloud_provider, data_bucket_host, data_bucket_name
    )

    # Task configuration creation
    data_filenames = cloud_service.list_files(
        data_bucket_host,
        data_bucket_name,
        data_bucket_path,
    )
    data_filenames = filter_image_files(data_filenames)

    gt_file_data = cloud_service.download_file(
        gt_bucket_host,
        gt_bucket_name,
        gt_filename,
    )
    gt_filenames = get_gt_filenames(gt_file_data, data_filenames, manifest=manifest)

    job_configuration = make_job_configuration(data_filenames, gt_filenames, manifest=manifest)
    label_configuration = make_label_configuration(manifest)

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
                data_bucket_name,
                bucket_host=data_bucket_host,
                provider=data_cloud_provider,
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


def remove_task(escrow_address: str) -> None:
    with SessionLocal.begin() as session:
        project = db_service.get_project_by_escrow_address(session, escrow_address)
        if project is not None:
            if project.cvat_cloudstorage_id:
                cvat_api.delete_cloudstorage(project.cvat_cloudstorage_id)
            if project.cvat_id:
                cvat_api.delete_project(project.cvat_id)
            db_service.delete_project(session, project.id)
