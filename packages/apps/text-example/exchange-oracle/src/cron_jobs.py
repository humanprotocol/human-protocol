from src.db import Session, Statuses, JobRequest, AnnotationProject
from src.config import Config
from src.chain import EscrowInfo
from src.annotation import create_job


def process_pending_job_requests():
    with Session() as session:
        requests = (
            session.query(JobRequest)
            .where(JobRequest.status == Statuses.pending.value)
            .limit(Config.cron_config.task_chunk_size)
        )

        for job_request in requests:
            info = EscrowInfo(
                escrow_address=job_request.escrow_address, chain_id=job_request.chain_id
            )
            try:
                project = create_job(info)
                job_request.status = Statuses.in_progress.value

                session.add(AnnotationProject(id=project.id, job_request=job_request))
            except Exception:
                job_request.status = Statuses.failed.value

        session.commit()
