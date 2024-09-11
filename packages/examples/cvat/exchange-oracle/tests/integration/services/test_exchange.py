import json
import unittest
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from src.core.types import AssignmentStatuses, JobStatuses, Networks
from src.db import SessionLocal
from src.endpoints.serializers import serialize_job

# TODO: test for serialize_assignment, resign_assignment
from src.models.cvat import Assignment, User
from src.schemas import exchange as service_api
from src.services.exchange import create_assignment

from tests.utils.db_helper import (
    create_job,
    create_project,
    create_project_task_and_job,
    create_task,
)


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_serialize_job(self):
        cvat_id = 1
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        cvat_project = create_project(self.session, escrow_address, cvat_id)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            data = serialize_job(cvat_project)

        assert data.escrow_address == escrow_address
        assert isinstance(data.job_description, str)
        assert data.job_description == manifest["annotation"]["description"]
        assert isinstance(data.reward_amount, str)
        assert data.reward_amount == manifest["job_bounty"]
        assert isinstance(data.reward_token, str)
        assert data.reward_token == service_api.DEFAULT_TOKEN
        assert data.job_type == cvat_project.job_type
        assert data.status == service_api.JobStatuses.active
        assert data.chain_id == cvat_project.chain_id
        assert data.created_at == cvat_project.created_at
        assert isinstance(data, service_api.JobResponse)

    def test_serialize_task_invalid_project(self):
        with pytest.raises(AssertionError):
            serialize_job(project=str(uuid.uuid4()))

    def test_serialize_task_invalid_manifest(self):
        cvat_id = 1
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        cvat_project = create_project(self.session, escrow_address, cvat_id)
        self.session.commit()

        with patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest:
            mock_get_manifest.return_value = None
            with pytest.raises(ValidationError):
                serialize_job(cvat_project)

    def test_create_assignment(self):
        cvat_project_1, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(
                cvat_project_1.escrow_address, cvat_project_1.chain_id, user_address
            )

            assignment = self.session.query(Assignment).filter_by(id=assignment_id).first()

            assert assignment.cvat_job_id == cvat_job_1.cvat_id
            assert assignment.user_wallet_address == user_address
            assert assignment.status == AssignmentStatuses.created

    def test_create_assignment_many_jobs_1_completed(self):
        cvat_project, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        cvat_job_1.status = JobStatuses.completed.value

        cvat_task_2 = create_task(self.session, 2, cvat_project.cvat_id)
        cvat_job_2 = create_job(self.session, 2, cvat_task_2.cvat_id, cvat_project.cvat_id)

        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        now = datetime.now()
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_job_1.cvat_id,
            created_at=now - timedelta(hours=1),
            completed_at=now - timedelta(minutes=40),
            expires_at=datetime.now() + timedelta(days=1),
            status=AssignmentStatuses.completed.value,
        )
        self.session.add(assignment)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(
                cvat_project.escrow_address, cvat_project.chain_id, user_address
            )

        assignment = self.session.query(Assignment).filter_by(id=assignment_id).first()

        assert assignment.cvat_job_id == cvat_job_2.cvat_id
        assert assignment.user_wallet_address == user_address
        assert assignment.status == AssignmentStatuses.created

    def test_create_assignment_invalid_user_address(self):
        cvat_project_1, _, _ = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        self.session.commit()

        with pytest.raises(HTTPException):
            create_assignment(
                cvat_project_1.escrow_address,
                cvat_project_1.chain_id,
                "invalid_address",
            )

    def test_create_assignment_invalid_project(self):
        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)
        self.session.commit()

        with pytest.raises(HTTPException):
            create_assignment("1", Networks.localhost.value, user_address)

    def test_create_assignment_unfinished_assignment(self):
        _, _, cvat_job = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        user_address = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user = User(
            wallet_address=user_address,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)
        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            with pytest.raises(HTTPException):
                create_assignment("1", Networks.localhost.value, user_address)

    def test_create_assignment_no_available_jobs_completed_assignment(self):
        cvat_project, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        cvat_job_1.status = JobStatuses.completed.value

        user_address1 = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user1 = User(
            wallet_address=user_address1,
            cvat_email="test1@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user1)

        user_address2 = "0x86e83d346041E8806e352681f3F14549C0d2BC70"
        user2 = User(
            wallet_address=user_address2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user2)

        now = datetime.now()
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address1,
            cvat_job_id=cvat_job_1.cvat_id,
            created_at=now - timedelta(days=1),
            completed_at=now - timedelta(hours=22),
            expires_at=now + timedelta(hours=2),
            status=AssignmentStatuses.completed.value,
        )
        self.session.add(assignment)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(
                cvat_project.escrow_address, cvat_project.chain_id, user_address2
            )

        assert assignment_id == None

    def test_create_assignment_no_available_jobs_active_foreign_assignment(self):
        cvat_project, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )

        user_address1 = "0x86e83d346041E8806e352681f3F14549C0d2BC69"
        user1 = User(
            wallet_address=user_address1,
            cvat_email="test1@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user1)

        user_address2 = "0x86e83d346041E8806e352681f3F14549C0d2BC70"
        user2 = User(
            wallet_address=user_address2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user2)

        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user_address1,
            cvat_job_id=cvat_job_1.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(
                cvat_project.escrow_address, cvat_project.chain_id, user_address2
            )

        assert assignment_id == None

    def test_create_assignment_wont_reassign_job_to_previous_user(self):
        cvat_project_1, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        cvat_job_1.status = JobStatuses.new.value  # validated and rejected return to 'new'

        user = User(
            wallet_address="0x86e83d346041E8806e352681f3F14549C0d2BC69",
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user)

        now = datetime.now()
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=user.wallet_address,
            cvat_job_id=cvat_job_1.cvat_id,
            created_at=now - timedelta(hours=1),
            completed_at=now - timedelta(minutes=40),
            expires_at=datetime.now() + timedelta(days=1),
            status=AssignmentStatuses.completed.value,
        )
        self.session.add(assignment)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(
                cvat_project_1.escrow_address, cvat_project_1.chain_id, user.wallet_address
            )

        assert assignment_id is None

    def test_create_assignment_can_assign_job_to_new_user(self):
        cvat_project_1, _, cvat_job_1 = create_project_task_and_job(
            self.session, "0x86e83d346041E8806e352681f3F14549C0d2BC67", 1
        )
        cvat_job_1.status = JobStatuses.new.value  # validated and rejected return to 'new'

        previous_user = User(
            wallet_address="0x86e83d346041E8806e352681f3F14549C0d2BC69",
            cvat_email="previous@hmt.ai",
            cvat_id=1,
        )
        new_user = User(
            wallet_address="0x69e83d346041E8806e352681f3F14549C0d2BC42",
            cvat_email="new@hmt.ai",
            cvat_id=2,
        )
        self.session.add(previous_user)
        self.session.add(new_user)

        now = datetime.now()
        assignment = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=previous_user.wallet_address,
            cvat_job_id=cvat_job_1.cvat_id,
            created_at=now - timedelta(hours=1),
            completed_at=now - timedelta(minutes=40),
            expires_at=datetime.now() + timedelta(days=1),
            status=AssignmentStatuses.completed.value,
        )
        self.session.add(assignment)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.endpoints.serializers.get_escrow_manifest") as mock_get_manifest,
            patch("src.services.exchange.cvat_api"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            assignment_id = create_assignment(
                cvat_project_1.escrow_address, cvat_project_1.chain_id, new_user.wallet_address
            )

        assignment = self.session.get(Assignment, assignment_id)

        assert assignment.cvat_job_id == cvat_job_1.cvat_id
        assert assignment.user_wallet_address == new_user.wallet_address
        assert assignment.status == AssignmentStatuses.created
