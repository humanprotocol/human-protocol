from src.db import SessionLocal
from .api_calls import delete_project, delete_cloustorage
from .service import get_project_by_escrow_address
from .service import delete_project as delete_db_project


def revert_job_creation(escrow_address: str):
    with SessionLocal.begin() as session:
        project = get_project_by_escrow_address(session, escrow_address)
        if project is not None:
            if project.cvat_cloudstorage_id:
                delete_cloustorage(project.cvat_cloudstorage_id)
            if project.cvat_id:
                delete_project(project.cvat_id)
            delete_db_project(session, project.id)
            session.commit()
