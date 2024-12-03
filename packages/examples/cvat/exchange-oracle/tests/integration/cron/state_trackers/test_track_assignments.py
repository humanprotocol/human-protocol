import unittest
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from sqlalchemy import update

from src.core.types import (
    AssignmentStatuses,
    ProjectStatuses,
)
from src.crons.cvat.state_trackers import track_assignments
from src.db import SessionLocal
from src.models.cvat import Assignment, Project, User

from tests.utils.db_helper import create_project_task_and_job


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_track_expired_assignments(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address_1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        wallet_address_2 = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        user = User(
            wallet_address=wallet_address_2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user)
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_1,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        assignment_2 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_2,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() - timedelta(days=1),
            created_at=datetime.now() + timedelta(hours=1),
        )
        self.session.add(assignment)
        self.session.add(assignment_2)
        self.session.commit()

        db_assignments = sorted(
            self.session.query(Assignment).all(), key=lambda assignment: assignment.user.cvat_id
        )
        assert db_assignments[0].status == AssignmentStatuses.created.value
        assert db_assignments[1].status == AssignmentStatuses.created.value

        with patch("src.crons.cvat.state_trackers.cvat_api.update_job_assignee") as mock_cvat_api:
            track_assignments()
            mock_cvat_api.assert_called_once_with(assignment_2.cvat_job_id, assignee_id=None)

        self.session.commit()

        db_assignments = sorted(
            self.session.query(Assignment).all(), key=lambda assignment: assignment.user.cvat_id
        )
        assert db_assignments[0].status == AssignmentStatuses.created.value
        assert db_assignments[1].status == AssignmentStatuses.expired.value

    @pytest.mark.xfail(
        strict=True,
        reason="""
Fix src.crons.cvat.state_trackers.py
Where in `cvat_service.get_active_assignments()` return value will be empty
because it actually looking for the expired assignments
""",
    )
    def test_track_canceled_assignments(self):
        (_, _, cvat_job) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        (cvat_project_2, _, cvat_job_2) = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC68", 2
        )
        wallet_address_1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address_1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        wallet_address_2 = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        user = User(
            wallet_address=wallet_address_2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user)
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_1,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        assignment_2 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address_2,
            cvat_job_id=cvat_job_2.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
            created_at=datetime.now() + timedelta(hours=1),
        )
        self.session.add(assignment)
        self.session.add(assignment_2)

        self.session.execute(
            update(Project)
            .where(Project.id == cvat_project_2.id)
            .values(status=ProjectStatuses.completed.value)
        )

        self.session.commit()

        db_assignments = sorted(
            self.session.query(Assignment).all(), key=lambda assignment: assignment.user.cvat_id
        )
        assert db_assignments[0].status == AssignmentStatuses.created.value
        assert db_assignments[1].status == AssignmentStatuses.created.value

        with patch("src.crons.cvat.state_trackers.cvat_api.update_job_assignee") as mock_cvat_api:
            track_assignments()
            mock_cvat_api.assert_called_once_with(assignment_2.cvat_job_id, assignee_id=None)

        self.session.commit()

        db_assignments = sorted(
            self.session.query(Assignment).all(), key=lambda assignment: assignment.user.cvat_id
        )
        assert db_assignments[0].status == AssignmentStatuses.created.value
        assert db_assignments[1].status == AssignmentStatuses.canceled.value
