from pathlib import Path
from uuid import uuid4

from basemodels import Manifest
from doccano_client import DoccanoClient

from src.config import Config


def create_project(manifest: Manifest, dataset_path: Path):
    client = DoccanoClient(base_url=Config.doccano.url(), verify=Config.doccano.ssl)
    client.login(username=Config.doccano.admin, password=Config.doccano.password)

    allow_overlapping = False

    if manifest.request_config and manifest.request_config.overlap_threshold:
        allow_overlapping = manifest.request_config.overlap_threshold > 0.0

    project = client.create_project(
        name=f"{uuid4().hex}_{manifest.job_id}",
        project_type="SequenceLabeling",
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
        project_id=project.id,
        file_paths=[dataset_path],
        format="JSON",
        column_data="text",
        column_label="label",
    )

    return project
