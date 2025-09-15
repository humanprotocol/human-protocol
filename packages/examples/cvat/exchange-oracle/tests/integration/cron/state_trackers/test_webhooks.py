import uuid
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest

from src.core.types import (
    AssignmentStatuses,
    CvatWebhookStatuses,
    JobStatuses,
    ProjectStatuses,
)
from src.crons.cvat.state_trackers import process_incoming_cvat_webhooks
from src.models.cvat import Assignment, CvatWebhook, Job, User
from src.services import cvat as cvat_service

from tests.utils.constants import ESCROW_ADDRESS, WALLET_ADDRESS1, WALLET_ADDRESS2
from tests.utils.db_helper import create_project_task_and_job


class CvatWebhookHandlingTest:
    @pytest.fixture(autouse=True)
    def setUp(self, session):
        self.session = session

        self.user1 = User(
            wallet_address=WALLET_ADDRESS1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(self.user1)

        self.user2 = User(
            wallet_address=WALLET_ADDRESS2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(self.user2)

        self.session.commit()

    @pytest.mark.parametrize("is_last_assignment", [True, False])
    def test_can_complete_assignment(self, is_last_assignment: bool):
        cvat_project, cvat_task, cvat_job = create_project_task_and_job(
            self.session, ESCROW_ADDRESS, 1
        )
        cvat_job.status = JobStatuses.in_progress
        self.session.add(cvat_job)

        assignment1 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=WALLET_ADDRESS1,
            cvat_job_id=cvat_job.cvat_id,
            created_at=datetime.now() - timedelta(hours=4),
            expires_at=datetime.now() - timedelta(hours=3),
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

        webhook_id = cvat_service.incoming_webhooks.create_webhook(
            self.session,
            event_type="update:job",
            event_data={
                "before_update": {
                    "state": "in_progress",
                },
                "job": {
                    "id": cvat_job.cvat_id,
                    "assignee": {
                        "id": (self.user2.cvat_id if is_last_assignment else self.user1.cvat_id)
                    },
                    "state": "completed",
                    "updated_date": (
                        (assignment2.created_at + timedelta(minutes=1))
                        if is_last_assignment
                        else (assignment1.created_at + timedelta(minutes=1))
                    ).isoformat()
                    + "Z",
                },
            },
            cvat_project_id=cvat_project.cvat_id,
            cvat_task_id=cvat_task.cvat_id,
            cvat_job_id=cvat_job.cvat_id,
        )
        self.session.commit()

        with patch(
            "src.crons.cvat.state_trackers.cvat_api.update_job_assignee"
        ) as mock_update_job_assignee:
            process_incoming_cvat_webhooks()
            self.session.commit()

        db_assignments = sorted(
            self.session.query(Assignment).all(), key=lambda assignment: assignment.user.cvat_id
        )
        assert len(db_assignments) == 2
        assert db_assignments[0].status == AssignmentStatuses.created

        if is_last_assignment:
            assert db_assignments[1].status == AssignmentStatuses.completed
            assert self.session.get(Job, cvat_job.id).status == JobStatuses.completed
            mock_update_job_assignee.assert_called_once_with(
                assignment2.cvat_job_id, assignee_id=None
            )
        else:
            assert db_assignments[1].status == AssignmentStatuses.created
            assert self.session.get(Job, cvat_job.id).status == JobStatuses.in_progress
            mock_update_job_assignee.assert_not_called()

        assert self.session.get(CvatWebhook, webhook_id).status == CvatWebhookStatuses.completed

    @pytest.mark.parametrize("is_last_assignment", [True, False])
    def test_can_expire_assignment(self, is_last_assignment: bool):
        cvat_project, cvat_task, cvat_job = create_project_task_and_job(
            self.session, ESCROW_ADDRESS, 1
        )
        cvat_job.status = JobStatuses.in_progress
        self.session.add(cvat_job)

        assignment1 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=WALLET_ADDRESS1,
            cvat_job_id=cvat_job.cvat_id,
            created_at=datetime.now() - timedelta(hours=4),
            expires_at=datetime.now() - timedelta(hours=3),
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

        webhook_id = cvat_service.incoming_webhooks.create_webhook(
            self.session,
            event_type="update:job",
            event_data={
                "before_update": {
                    "state": "in_progress",
                },
                "job": {
                    "id": cvat_job.cvat_id,
                    "assignee": {
                        "id": (self.user2.cvat_id if is_last_assignment else self.user1.cvat_id)
                    },
                    "state": "completed",
                    "updated_date": (
                        (assignment2.expires_at + timedelta(minutes=1))
                        if is_last_assignment
                        else (assignment1.expires_at + timedelta(minutes=1))
                    ).isoformat()
                    + "Z",
                },
            },
            cvat_project_id=cvat_project.cvat_id,
            cvat_task_id=cvat_task.cvat_id,
            cvat_job_id=cvat_job.cvat_id,
        )
        self.session.commit()

        with patch(
            "src.crons.cvat.state_trackers.cvat_api.update_job_assignee"
        ) as mock_update_job_assignee:
            process_incoming_cvat_webhooks()
            self.session.commit()

        db_assignments = sorted(
            self.session.query(Assignment).all(), key=lambda assignment: assignment.user.cvat_id
        )
        assert len(db_assignments) == 2
        assert db_assignments[0].status == AssignmentStatuses.created

        if is_last_assignment:
            assert db_assignments[1].status == AssignmentStatuses.expired
            assert self.session.get(Job, cvat_job.id).status == JobStatuses.new
            mock_update_job_assignee.assert_called_once_with(
                assignment2.cvat_job_id, assignee_id=None
            )
        else:
            assert db_assignments[1].status == AssignmentStatuses.created
            assert self.session.get(Job, cvat_job.id).status == JobStatuses.in_progress
            mock_update_job_assignee.assert_not_called()

        assert self.session.get(CvatWebhook, webhook_id).status == CvatWebhookStatuses.completed

    def test_can_ignore_non_status_update(self):
        cvat_project, cvat_task, cvat_job = create_project_task_and_job(
            self.session, ESCROW_ADDRESS, 1
        )
        cvat_job.status = JobStatuses.in_progress
        self.session.add(cvat_job)

        assignment1 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=WALLET_ADDRESS1,
            cvat_job_id=cvat_job.cvat_id,
            created_at=datetime.now() - timedelta(hours=4),
            expires_at=datetime.now() - timedelta(hours=3),
            status=AssignmentStatuses.created,
        )
        self.session.add(assignment1)

        webhook_id = cvat_service.incoming_webhooks.create_webhook(
            self.session,
            event_type="update:job",
            event_data={},
            cvat_project_id=cvat_project.cvat_id,
            cvat_task_id=cvat_task.cvat_id,
            cvat_job_id=cvat_job.cvat_id,
        )
        self.session.commit()

        process_incoming_cvat_webhooks()
        self.session.commit()

        db_assignments = sorted(
            self.session.query(Assignment).all(), key=lambda assignment: assignment.user.cvat_id
        )
        assert len(db_assignments) == 1
        assert db_assignments[0].status == AssignmentStatuses.created
        assert self.session.get(Job, cvat_job.id).status == JobStatuses.in_progress
        assert self.session.get(CvatWebhook, webhook_id).status == CvatWebhookStatuses.completed

    def test_can_ignore_update_for_job_in_non_annotation_status(self):
        cvat_project, cvat_task, cvat_job = create_project_task_and_job(
            self.session, ESCROW_ADDRESS, 1
        )
        cvat_job.status = JobStatuses.completed
        self.session.add(cvat_job)

        webhook_id = cvat_service.incoming_webhooks.create_webhook(
            self.session,
            event_type="update:job",
            event_data={
                "before_update": {
                    "state": "in_progress",
                },
                "job": {
                    "id": cvat_job.cvat_id,
                    "assignee": {"id": self.user2.cvat_id},
                    "state": "completed",
                    "updated_date": datetime.now().isoformat() + "Z",
                },
            },
            cvat_project_id=cvat_project.cvat_id,
            cvat_task_id=cvat_task.cvat_id,
            cvat_job_id=cvat_job.cvat_id,
        )
        self.session.commit()

        process_incoming_cvat_webhooks()
        self.session.commit()

        assert self.session.get(Job, cvat_job.id).status == JobStatuses.completed
        assert self.session.get(CvatWebhook, webhook_id).status == CvatWebhookStatuses.completed

    def test_can_ignore_update_for_project_in_non_annotation_status(self):
        cvat_project, cvat_task, cvat_job = create_project_task_and_job(
            self.session, ESCROW_ADDRESS, 1
        )
        cvat_project.status = ProjectStatuses.deleted
        cvat_job.status = JobStatuses.in_progress
        self.session.add(cvat_job)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=WALLET_ADDRESS2,
            cvat_job_id=cvat_job.cvat_id,
            created_at=datetime.now() - timedelta(hours=1),
            expires_at=datetime.now() + timedelta(hours=1),
            status=AssignmentStatuses.created,
        )
        self.session.add(assignment)

        webhook_id = cvat_service.incoming_webhooks.create_webhook(
            self.session,
            event_type="update:job",
            event_data={
                "before_update": {
                    "state": "in_progress",
                },
                "job": {
                    "id": cvat_job.cvat_id,
                    "assignee": {"id": self.user2.cvat_id},
                    "state": "completed",
                    "updated_date": datetime.now().isoformat() + "Z",
                },
            },
            cvat_project_id=cvat_project.cvat_id,
            cvat_task_id=cvat_task.cvat_id,
            cvat_job_id=cvat_job.cvat_id,
        )
        self.session.commit()

        process_incoming_cvat_webhooks()
        self.session.commit()

        assert self.session.get(Job, cvat_job.id).status == JobStatuses.in_progress
        assert self.session.get(CvatWebhook, webhook_id).status == CvatWebhookStatuses.completed
