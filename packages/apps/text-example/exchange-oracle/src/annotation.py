from pathlib import Path

from basemodels import Manifest
from doccano_client import DoccanoClient
from doccano_client.models.data_upload import Task
from pydantic import BaseModel, constr
from src.config import Config

EtheriumAddress = constr(
    strip_whitespace=True,
    to_lower=True,
    min_length=42,
    max_length=42,
    regex="0x[a-f0-9]{40}",
)


class JobApplication(BaseModel):
    worker_id: EtheriumAddress
    job_id: str


class UserRegistrationInfo(BaseModel):
    worker_address: EtheriumAddress
    name: constr(
        strip_whitespace=True, min_length=3, max_length=30, regex="[a-zA-Z0-9_-]{3,30}"
    )


def get_client():
    client = DoccanoClient(base_url=Config.doccano.url(), verify=Config.doccano.ssl)
    client.login(username=Config.doccano.admin, password=Config.doccano.password)
    return client


def create_project(
    manifest: Manifest, dataset_path: Path, suffix="", client=get_client()
):
    allow_overlapping = False
    if manifest.request_config and manifest.request_config.overlap_threshold:
        allow_overlapping = manifest.request_config.overlap_threshold > 0.0

    task = Task.SEQUENCE_LABELING
    project = client.create_project(
        name=f"{manifest.job_id}__{dataset_path.stem}{suffix}",
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


def create_projects(manifest: Manifest, data_dir: Path, client=get_client()):
    """Creates multiple projects by creating a number of projects for each jsonl file under data_dir."""
    project_replicas = list(range(manifest.requester_max_repeats))
    projects = []
    for dataset_path in data_dir.glob("*.jsonl"):
        for i in project_replicas:
            project = create_project(
                manifest, dataset_path, suffix=f"-{i}", client=client
            )
            projects.append(project)

    return projects


def create_user(username: str, password: str, client=get_client()):
    client.create_user(username, password)


def register_annotator(username: str, project_id: int, client=get_client()):
    client.add_member(project_id=project_id, username=username, role_name="annotator")


def is_done(project_id: int, client=get_client()):
    return client.get_progress(project_id).remaining == 0


def download_annotations(project_id: int, job_request_id: str, client=get_client()):
    dir_name = Config.storage_config.dataset_dir / job_request_id / project_id
    client.download(project_id, format="JSONL", dir_name=dir_name, only_approved=True)
    return dir_name


def delete_project(project_id: int, client=get_client()):
    client.delete_project(project_id)
