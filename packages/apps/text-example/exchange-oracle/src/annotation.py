from pathlib import Path

from basemodels import Manifest
from doccano_client import DoccanoClient
from doccano_client.models.data_upload import Task

from chain import EscrowInfo, get_manifest_url
from src.config import Config
from storage import download_manifest, download_datasets, convert_taskdata_to_doccano


def create_project(manifest: Manifest, dataset_path: Path):
    client = DoccanoClient(base_url=Config.doccano.url(), verify=Config.doccano.ssl)
    client.login(username=Config.doccano.admin, password=Config.doccano.password)

    allow_overlapping = False

    if manifest.request_config and manifest.request_config.overlap_threshold:
        allow_overlapping = manifest.request_config.overlap_threshold > 0.0

    task = Task.SEQUENCE_LABELING
    project = client.create_project(
        name=str(manifest.job_id),
        project_type=task.value,
        collaborative_annotation=False,
        description=manifest.requester_description,
        guideline=manifest.requester_question.get("en"),
        allow_overlapping=allow_overlapping,
        random_order=True,
        grapheme_mode=False,
        use_relation=False,
        single_class_classification=False,
        tags=None,
    )

    for lang in manifest.requester_restricted_answer_set.values():
        client.create_label_type(
            project_id=project.id, type="span", text=lang.get("en")
        )

    client.upload(
        task=task,
        project_id=project.id,
        file_paths=[str(dataset_path.resolve())],
        format="JSONL",
        column_data="text",
        column_label="label",
    )

    return project


def create_job(escrow_info: EscrowInfo):
    """Creates a new job."""

    # get manifest from escrow url
    s3_url = get_manifest_url(escrow_info)
    manifest = download_manifest(s3_url)

    # download job data
    job_dir = download_datasets(manifest)

    # FIXME: probably need some chunking since doccano does not allow individual assignment of tasks, will cross that bridge once we get there
    # convert data into doccano format
    doccano_filepath = convert_taskdata_to_doccano(job_dir)
    project = create_project(manifest, doccano_filepath)

    return project
