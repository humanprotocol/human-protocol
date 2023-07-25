from src.database import SessionLocal

from src.modules.cvat.helpers import parse_manifest, compose_bucket_url

import src.modules.cvat.service as db_service
import src.modules.cvat.api_calls as cvat_api


def job_creation_process(escrow_address: str, chain_id: int, manifest: dict) -> None:
    (provider, bucket_name, labels, job_type) = parse_manifest(manifest)
    # Create a cloudstorage on CVAT for not storing datasets on CVAT instance
    cloudstorage = cvat_api.create_cloudstorage(provider, bucket_name)
    # Creating a project on CVAT. Necessary because otherwise webhooks aren't available
    project = cvat_api.create_project(escrow_address, labels)
    with SessionLocal.begin() as session:
        db_service.create_project(
            session,
            project.id,
            cloudstorage.id,
            job_type,
            escrow_address,
            chain_id,
            compose_bucket_url(bucket_name, provider),
        )
    # Setup webhooks for a project (update:task, update:job)
    cvat_api.setup_cvat_webhooks(project.id)
    # Task creation
    task = cvat_api.create_task(project.id, escrow_address)
    with SessionLocal.begin() as session:
        db_service.create_task(session, task.id, project.id, task.status)

    # Actual job creation on CVAT. Async process (will be created in DB once 'update:task' or 'update:job' webhook is received)
    cvat_api.put_task_data(task.id, cloudstorage.id)


def revert_job_creation(escrow_address: str) -> None:
    with SessionLocal.begin() as session:
        project = db_service.get_project_by_escrow_address(session, escrow_address)
        if project is not None:
            if project.cvat_cloudstorage_id:
                cvat_api.delete_cloustorage(project.cvat_cloudstorage_id)
            if project.cvat_id:
                cvat_api.delete_project(project.cvat_id)
            db_service.delete_project(session, project.id)
            session.commit()
