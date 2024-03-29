import uuid
from typing import List, Optional, Union

from sqlalchemy.orm import Session

from src.db.utils import ForUpdateParams
from src.db.utils import maybe_for_update as _maybe_for_update
from src.models.validation import Job, Task, ValidationResult


def create_task(session: Session, escrow_address: str, chain_id: int) -> str:
    obj_id = str(uuid.uuid4())
    obj = Task(id=obj_id, escrow_address=escrow_address, chain_id=chain_id)

    session.add(obj)

    return obj_id


def get_task_by_escrow_address(
    session: Session, escrow_address: str, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[Task]:
    return (
        _maybe_for_update(session.query(Task), enable=for_update)
        .where(Task.escrow_address == escrow_address)
        .first()
    )


def get_task_by_id(
    session: Session, task_id: str, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[Task]:
    return (
        _maybe_for_update(session.query(Task), enable=for_update).where(Task.id == task_id).first()
    )


def get_task_validation_results(
    session: Session, task_id: str, *, for_update: Union[bool, ForUpdateParams] = False
) -> List[ValidationResult]:
    return (
        _maybe_for_update(session.query(ValidationResult), enable=for_update)
        .where(ValidationResult.job.has(Job.task_id == task_id))
        .all()
    )


def create_job(session: Session, job_cvat_id: int, task_id: str) -> str:
    obj_id = str(uuid.uuid4())
    obj = Job(id=obj_id, cvat_id=job_cvat_id, task_id=task_id)

    session.add(obj)

    return obj_id


def get_job_by_cvat_id(
    session: Session, job_cvat_id: int, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[Job]:
    return (
        _maybe_for_update(session.query(Job), enable=for_update)
        .where(Job.cvat_id == job_cvat_id)
        .first()
    )


def get_job_by_id(
    session: Session, job_id: str, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[Job]:
    return _maybe_for_update(session.query(Job), enable=for_update).where(Job.id == job_id).first()


def create_validation_result(
    session: Session,
    job_id: str,
    annotator_wallet_address: str,
    annotation_quality: float,
    assignment_id: str,
) -> str:
    obj_id = str(uuid.uuid4())
    obj = ValidationResult(
        id=obj_id,
        job_id=job_id,
        annotator_wallet_address=annotator_wallet_address,
        annotation_quality=annotation_quality,
        assignment_id=assignment_id,
    )

    session.add(obj)

    return obj_id


def get_validation_result_by_assignment_id(
    session: Session, assignment_id: str, *, for_update: Union[bool, ForUpdateParams] = False
) -> Optional[ValidationResult]:
    return (
        _maybe_for_update(session.query(ValidationResult), enable=for_update)
        .where(ValidationResult.assignment_id == assignment_id)
        .first()
    )
