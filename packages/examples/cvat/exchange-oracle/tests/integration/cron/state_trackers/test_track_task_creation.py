import unittest
import uuid
from unittest.mock import Mock, patch

import src.cvat.api_calls as cvat_api
from src.core.types import ExchangeOracleEventTypes, JobStatuses
from src.crons.cvat.state_trackers import track_task_creation
from src.db import SessionLocal
from src.models.cvat import DataUpload, Job
from src.models.webhook import Webhook

from tests.utils.db_helper import create_project_and_task, create_project_task_and_job


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_track_track_failed_task_creation(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        (_, cvat_task) = create_project_and_task(self.session, escrow_address, 1)
        upload_id = str(uuid.uuid4())
        upload = DataUpload(
            id=upload_id,
            task_id=cvat_task.cvat_id,
        )
        self.session.add(upload)
        self.session.commit()

        with patch(
            "src.crons.cvat.state_trackers.cvat_api.get_task_upload_status"
        ) as mock_get_task_upload_status:
            mock_get_task_upload_status.return_value = (cvat_api.UploadStatus.FAILED, "Failed")

            track_task_creation()

        webhook = self.session.query(Webhook).filter_by(escrow_address=escrow_address).first()
        assert webhook is not None
        data_upload = self.session.query(DataUpload).filter_by(id=upload_id).first()
        assert data_upload is None

    def test_track_track_completed_task_creation(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        (_, cvat_task, cvat_job) = create_project_task_and_job(self.session, escrow_address, 1)
        upload_id = str(uuid.uuid4())
        upload = DataUpload(
            id=upload_id,
            task_id=cvat_task.cvat_id,
        )
        self.session.add(upload)
        self.session.commit()

        new_cvat_job_id = 2
        with (
            patch(
                "src.crons.cvat.state_trackers.cvat_api.get_task_upload_status"
            ) as mock_get_task_upload_status,
            patch("src.crons.cvat.state_trackers.cvat_api.fetch_task_jobs") as mock_fetch_task_jobs,
        ):
            mock_get_task_upload_status.return_value = (cvat_api.UploadStatus.FINISHED, None)
            mock_cvat_job_1 = Mock()
            mock_cvat_job_1.id = cvat_job.cvat_id

            mock_cvat_job_2 = Mock()
            mock_cvat_job_2.id = new_cvat_job_id
            mock_cvat_job_2.state = JobStatuses.in_progress

            mock_fetch_task_jobs.return_value = [mock_cvat_job_1, mock_cvat_job_2]

            track_task_creation()

        self.session.commit()

        jobs = self.session.query(Job).all()
        assert jobs is not None
        assert len(jobs) == 2
        assert any(job.cvat_id == 2 for job in jobs)
        data_upload = self.session.query(DataUpload).filter_by(id=upload_id).first()
        assert data_upload is None

    def test_track_track_completed_task_creation_error(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        (_, cvat_task, cvat_job) = create_project_task_and_job(self.session, escrow_address, 1)
        upload = DataUpload(
            id=str(uuid.uuid4()),
            task_id=cvat_task.cvat_id,
        )
        self.session.add(upload)
        self.session.commit()

        with (
            patch(
                "src.crons.cvat.state_trackers.cvat_api.get_task_upload_status"
            ) as mock_get_task_upload_status,
            patch(
                "src.crons.cvat.state_trackers.cvat_api.fetch_task_jobs",
                side_effect=cvat_api.exceptions.ApiException("Error"),
            ),
        ):
            mock_get_task_upload_status.return_value = (cvat_api.UploadStatus.FINISHED, None)

            track_task_creation()

        self.session.commit()

        webhook = self.session.query(Webhook).filter_by(escrow_address=escrow_address).first()
        assert webhook is not None
        assert webhook.event_type == ExchangeOracleEventTypes.task_creation_failed
