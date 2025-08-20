import unittest
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch

from src.core.types import (
    AssignmentStatuses,
    JobStatuses,
)
from src.crons.cvat.state_trackers import track_assignments
from src.db import SessionLocal
from src.models.cvat import Assignment, Job, User

from tests.utils.constants import ESCROW_ADDRESS, WALLET_ADDRESS1, WALLET_ADDRESS2
from tests.utils.db_helper import create_project_task_and_job


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_can_track_expired_assignments(self):
        (_, _, cvat_job) = create_project_task_and_job(self.session, ESCROW_ADDRESS, 1)
        cvat_job.status = JobStatuses.in_progress
        self.session.add(cvat_job)

        user = User(
            wallet_address=WALLET_ADDRESS1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        user = User(
            wallet_address=WALLET_ADDRESS2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user)

        assignment1 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=WALLET_ADDRESS1,
            cvat_job_id=cvat_job.cvat_id,
            created_at=datetime.now() - timedelta(hours=2),
            expires_at=datetime.now() - timedelta(hours=1),
            status=AssignmentStatuses.created,
        )
        self.session.add(assignment1)

        assignment2 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=WALLET_ADDRESS2,
            cvat_job_id=cvat_job.cvat_id,
            created_at=datetime.now() - timedelta(hours=1),
            expires_at=datetime.now(),
            status=AssignmentStatuses.created,
        )
        self.session.add(assignment2)

        self.session.commit()

        with patch(
            "src.crons.cvat.state_trackers.cvat_api.update_job_assignee"
        ) as update_job_assignee:
            track_assignments()

        update_job_assignee.assert_called_once_with(assignment2.cvat_job_id, assignee_id=None)

        db_assignments = sorted(
            self.session.query(Assignment).all(), key=lambda assignment: assignment.user.cvat_id
        )
        assert db_assignments[0].status == AssignmentStatuses.expired
        assert db_assignments[1].status == AssignmentStatuses.expired

        assert (
            self.session.query(Job).filter(Job.id == cvat_job.id).first().status == JobStatuses.new
        )

    def test_can_track_canceled_assignments(self):
        (_, _, cvat_job) = create_project_task_and_job(self.session, ESCROW_ADDRESS, 1)
        cvat_job.status = JobStatuses.in_progress
        self.session.add(cvat_job)

        user = User(
            wallet_address=WALLET_ADDRESS1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        user = User(
            wallet_address=WALLET_ADDRESS2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user)

        assignment1 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=WALLET_ADDRESS1,
            cvat_job_id=cvat_job.cvat_id,
            created_at=datetime.now() - timedelta(hours=2),
            expires_at=datetime.now() - timedelta(hours=1),
            status=AssignmentStatuses.canceled,
        )
        self.session.add(assignment1)

        assignment2 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=WALLET_ADDRESS2,
            cvat_job_id=cvat_job.cvat_id,
            created_at=datetime.now() - timedelta(hours=1),
            expires_at=datetime.now() + timedelta(hours=1),
            status=AssignmentStatuses.canceled,
        )
        self.session.add(assignment2)

        self.session.commit()

        with patch(
            "src.crons.cvat.state_trackers.cvat_api.update_job_assignee"
        ) as update_job_assignee:
            track_assignments()

        update_job_assignee.assert_called_once_with(assignment2.cvat_job_id, assignee_id=None)

        db_assignments = sorted(
            self.session.query(Assignment).all(), key=lambda assignment: assignment.user.cvat_id
        )
        assert db_assignments[0].status == AssignmentStatuses.canceled
        assert db_assignments[1].status == AssignmentStatuses.canceled

        assert (
            self.session.query(Job).filter(Job.id == cvat_job.id).first().status == JobStatuses.new
        )
