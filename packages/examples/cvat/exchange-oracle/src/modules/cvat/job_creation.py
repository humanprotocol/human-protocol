from src.db import SessionLocal
from .api_calls import (
    create_cloudstorage,
    create_project,
    create_task,
    setup_cvat_webhooks,
    put_task_data,
)
from .helpers import parse_manifest
from .service import create_task as create_db_task
from .service import create_project as create_db_project


def job_creation_process(escrow_address: str, manifest: dict):
    (provider, bucket_name, labels) = parse_manifest(manifest)
    # Create a cloudstorage on CVAT for not storing datasets on CVAT instance
    cloudstorage = create_cloudstorage(provider, bucket_name)
    # Creating a project on CVAT. Necessary because otherwise webhooks aren't available
    project = create_project(escrow_address, labels)
    with SessionLocal.begin() as session:
        create_db_project(session, project.id)
    # Setup webhooks for a project (update:task, update:job)
    setup_cvat_webhooks(project.id)
    # Task creation
    task = create_task(project.id, escrow_address)
    with SessionLocal.begin() as session:
        create_db_task(session, task.id, project.id, task.status)
    # Actual job creation on CVAT. Async process (will be created in DB once 'update:task' or 'update:job' webhook is received)
    put_task_data(task.id, cloudstorage.id)
