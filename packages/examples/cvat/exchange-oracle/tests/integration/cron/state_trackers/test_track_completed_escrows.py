import io
import json
import os
import unittest
import uuid
import zipfile
from datetime import datetime, timedelta
from glob import glob
from tempfile import TemporaryDirectory
from unittest.mock import Mock, patch

import datumaro as dm
import pytest
from sqlalchemy import select

from src.core.types import (
    AssignmentStatuses,
    EscrowValidationStatuses,
    ExchangeOracleEventTypes,
    JobStatuses,
    Networks,
    ProjectStatuses,
    TaskStatuses,
    TaskTypes,
)
from src.crons import track_completed_escrows
from src.crons.cvat.state_trackers import track_escrow_validations
from src.db import SessionLocal
from src.models.cvat import Assignment, EscrowValidation, Image, Job, Project, Task, User
from src.models.webhook import Webhook
from src.services.cvat import create_escrow_validations

from tests.utils.db_helper import create_project_task_and_job


class _TestException(RuntimeError): ...


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        self.session = SessionLocal()

    def tearDown(self):
        self.session.close()

    def test_can_begin_validation_when_there_is_a_completed_escrow_with_several_projects(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        cvat_project1, cvat_task1, cvat_job1 = create_project_task_and_job(
            self.session, escrow_address, 1
        )
        chain_id = cvat_project1.chain_id
        cvat_project1.status = ProjectStatuses.completed
        self.session.add(cvat_project1)

        cvat_task1.status = TaskStatuses.completed
        self.session.add(cvat_task1)

        cvat_job1.status = JobStatuses.completed
        self.session.add(cvat_job1)

        cvat_project2, cvat_task2, cvat_job2 = create_project_task_and_job(
            self.session, escrow_address, 2
        )
        cvat_project2.status = ProjectStatuses.completed
        self.session.add(cvat_project2)

        cvat_task2.status = TaskStatuses.completed
        self.session.add(cvat_task2)

        cvat_job2.status = JobStatuses.completed
        self.session.add(cvat_job2)

        wallet_address1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user1 = User(
            wallet_address=wallet_address1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user1)

        wallet_address2 = "0x86e83d346041E8806e352681f3F14549C0d2BC68"
        user2 = User(
            wallet_address=wallet_address2,
            cvat_email="test2@hmt.ai",
            cvat_id=2,
        )
        self.session.add(user2)

        assignment1 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address1,
            cvat_job_id=cvat_job1.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment1)

        assignment2 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address2,
            cvat_job_id=cvat_job2.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment2)

        self.session.commit()

        track_completed_escrows()

        assert self.session.query(EscrowValidation).count() == 1

        db_validation = self.session.scalar(
            select(EscrowValidation).where(
                EscrowValidation.escrow_address == escrow_address,
                EscrowValidation.chain_id == chain_id,
            )
        )
        assert db_validation.attempts == 0
        assert db_validation.status == EscrowValidationStatuses.awaiting

        db_project1 = self.session.query(Project).filter_by(cvat_id=1).first()
        assert db_project1.status == ProjectStatuses.validation

        db_project2 = self.session.query(Project).filter_by(cvat_id=2).first()
        assert db_project2.status == ProjectStatuses.validation

    def test_cant_begin_validation_when_there_is_an_incomplete_escrow_with_several_projects(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"

        cvat_project1, cvat_task1, cvat_job1 = create_project_task_and_job(
            self.session, escrow_address, 1
        )
        cvat_project1.status = ProjectStatuses.completed
        self.session.add(cvat_project1)

        cvat_task1.status = TaskStatuses.completed
        self.session.add(cvat_task1)

        cvat_job1.status = JobStatuses.completed
        self.session.add(cvat_job1)

        cvat_project2, cvat_task2, cvat_job2 = create_project_task_and_job(
            self.session, escrow_address, 2
        )
        cvat_project2.status = ProjectStatuses.annotation
        self.session.add(cvat_project2)

        cvat_task2.status = TaskStatuses.annotation
        self.session.add(cvat_task2)

        cvat_job2.status = JobStatuses.new
        self.session.add(cvat_job2)

        wallet_address1 = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user1 = User(
            wallet_address=wallet_address1,
            cvat_email="test@hmt.ai",
            cvat_id=1,
        )
        self.session.add(user1)

        assignment1 = Assignment(
            id=str(uuid.uuid4()),
            user_wallet_address=wallet_address1,
            cvat_job_id=cvat_job1.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment1)

        self.session.commit()

        track_completed_escrows()

        assert self.session.query(EscrowValidation).count() == 0

    def test_retrieve_annotations(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost

        cvat_project_id = 1
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_project_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.validation,
            job_type=TaskTypes.image_label_binary,
            escrow_address=escrow_address,
            chain_id=chain_id,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        project_images = ["sample1.jpg", "sample2.png"]
        for image_filename in project_images:
            self.session.add(
                Image(
                    id=str(uuid.uuid4()), cvat_project_id=cvat_project_id, filename=image_filename
                )
            )

        cvat_task_id = 1
        cvat_task = Task(
            id=str(uuid.uuid4()),
            cvat_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=TaskStatuses.completed,
        )
        self.session.add(cvat_task)

        cvat_job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=cvat_project_id,
            cvat_task_id=cvat_task_id,
            status=JobStatuses.completed,
            start_frame=0,
            stop_frame=1,
        )
        self.session.add(cvat_job)
        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address,
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
            user_wallet_address=wallet_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)

        validation_id = str(uuid.uuid4())
        validation = EscrowValidation(
            id=validation_id,
            escrow_address=escrow_address,
            chain_id=chain_id,
            status=EscrowValidationStatuses.awaiting,
        )
        self.session.add(validation)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.handlers.completed_escrows.get_escrow_manifest") as mock_get_manifest,
            patch("src.handlers.completed_escrows.validate_escrow"),
            patch("src.handlers.completed_escrows.cvat_api") as mock_cvat_api,
            patch("src.handlers.completed_escrows.cloud_service") as mock_cloud_service,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            dummy_zip_file = io.BytesIO()
            with zipfile.ZipFile(dummy_zip_file, "w") as archive, TemporaryDirectory() as tempdir:
                mock_dataset = dm.Dataset(
                    media_type=dm.Image,
                    categories={
                        dm.AnnotationType.label: dm.LabelCategories.from_iterable(["cat", "dog"])
                    },
                )
                for image_filename in project_images:
                    mock_dataset.put(dm.DatasetItem(id=os.path.splitext(image_filename)[0]))
                mock_dataset.export(tempdir, format="coco_instances")

                for filename in list(glob(os.path.join(tempdir, "**/*"), recursive=True)):
                    archive.write(filename, os.path.relpath(filename, tempdir))
            dummy_zip_file.seek(0)

            mock_cvat_api.get_job_annotations.return_value = dummy_zip_file
            mock_cvat_api.get_project_annotations.return_value = dummy_zip_file

            mock_storage_client = Mock()
            mock_storage_client.create_file = Mock()
            mock_storage_client.list_files = Mock(return_value=[])
            mock_cloud_service.make_client = Mock(return_value=mock_storage_client)

            track_escrow_validations()

        webhook = (
            self.session.query(Webhook)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        assert webhook is not None
        assert webhook.event_type == ExchangeOracleEventTypes.job_finished

        db_project = self.session.query(Project).filter_by(id=project_id).first()
        assert db_project.status == ProjectStatuses.validation

        db_validation = (
            self.session.query(EscrowValidation)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        assert db_validation.status == EscrowValidationStatuses.in_progress
        assert db_validation.attempts == 1

    def test_retrieve_annotations_error_getting_annotations(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost

        cvat_project_id = 1
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_project_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.validation,
            job_type=TaskTypes.image_label_binary,
            escrow_address=escrow_address,
            chain_id=chain_id,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        cvat_task_id = 1
        cvat_task = Task(
            id=str(uuid.uuid4()),
            cvat_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=TaskStatuses.completed,
        )
        self.session.add(cvat_task)

        cvat_job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=cvat_project_id,
            cvat_task_id=cvat_task_id,
            status=JobStatuses.completed,
            start_frame=0,
            stop_frame=1,
        )
        self.session.add(cvat_job)
        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address,
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
            user_wallet_address=wallet_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        self.session.add(assignment)

        validation_id = str(uuid.uuid4())
        validation = EscrowValidation(
            id=validation_id,
            escrow_address=escrow_address,
            chain_id=chain_id,
            status=EscrowValidationStatuses.awaiting,
        )
        self.session.add(validation)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.handlers.completed_escrows.get_escrow_manifest") as mock_get_manifest,
            patch("src.handlers.completed_escrows.validate_escrow"),
            patch(
                "src.handlers.completed_escrows.cvat_api.request_job_annotations"
            ) as mock_request_job_annotations,
            patch("src.handlers.completed_escrows.cloud_service") as mock_cloud_service,
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest

            mock_create_file = Mock()
            mock_storage_client = Mock()
            mock_storage_client.create_file = mock_create_file
            mock_cloud_service.make_client = Mock(return_value=mock_storage_client)

            mock_request_job_annotations.side_effect = _TestException()

            track_escrow_validations()

            mock_request_job_annotations.assert_called()

        webhook = (
            self.session.query(Webhook)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        assert webhook is None

        db_project = self.session.query(Project).filter_by(id=project_id).first()
        assert db_project.status == ProjectStatuses.validation

        db_validation = (
            self.session.query(EscrowValidation)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        assert db_validation.status == EscrowValidationStatuses.awaiting
        assert db_validation.attempts == 1

    def test_retrieve_annotations_error_uploading_files(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        chain_id = Networks.localhost

        cvat_project_id = 1
        project_id = str(uuid.uuid4())
        cvat_project = Project(
            id=project_id,
            cvat_id=cvat_project_id,
            cvat_cloudstorage_id=1,
            status=ProjectStatuses.validation,
            job_type=TaskTypes.image_label_binary,
            escrow_address=escrow_address,
            chain_id=chain_id,
            bucket_url="https://test.storage.googleapis.com/",
        )
        self.session.add(cvat_project)

        cvat_task_id = 1
        cvat_task = Task(
            id=str(uuid.uuid4()),
            cvat_id=cvat_task_id,
            cvat_project_id=cvat_project_id,
            status=TaskStatuses.completed,
        )
        self.session.add(cvat_task)

        cvat_job = Job(
            id=str(uuid.uuid4()),
            cvat_id=1,
            cvat_project_id=cvat_project_id,
            cvat_task_id=cvat_task_id,
            status=JobStatuses.completed,
            start_frame=0,
            stop_frame=1,
        )
        self.session.add(cvat_job)
        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address,
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
            user_wallet_address=wallet_address,
            cvat_job_id=cvat_job.cvat_id,
            expires_at=datetime.now() + timedelta(days=1),
        )
        project_images = ["sample1.jpg", "sample2.png"]

        for image_filename in project_images:
            self.session.add(
                Image(
                    id=str(uuid.uuid4()), cvat_project_id=cvat_project_id, filename=image_filename
                )
            )

        self.session.add(assignment)

        validation_id = str(uuid.uuid4())
        validation = EscrowValidation(
            id=validation_id,
            escrow_address=escrow_address,
            chain_id=chain_id,
            status=EscrowValidationStatuses.awaiting,
        )
        self.session.add(validation)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as data,
            patch("src.handlers.completed_escrows.get_escrow_manifest") as mock_get_manifest,
            patch("src.handlers.completed_escrows.validate_escrow"),
            patch("src.handlers.completed_escrows.cvat_api") as mock_cvat_api,
            patch("src.handlers.completed_escrows.cloud_service") as mock_cloud_service,
            patch("src.services.cloud.make_client"),
        ):
            manifest = json.load(data)
            mock_get_manifest.return_value = manifest
            dummy_zip_file = io.BytesIO()
            with zipfile.ZipFile(dummy_zip_file, "w") as archive, TemporaryDirectory() as tempdir:
                mock_dataset = dm.Dataset(
                    media_type=dm.Image,
                    categories={
                        dm.AnnotationType.label: dm.LabelCategories.from_iterable(["cat", "dog"])
                    },
                )
                for image_filename in project_images:
                    mock_dataset.put(dm.DatasetItem(id=os.path.splitext(image_filename)[0]))
                mock_dataset.export(tempdir, format="coco_instances")

                for filename in list(glob(os.path.join(tempdir, "**/*"), recursive=True)):
                    archive.write(filename, os.path.relpath(filename, tempdir))
            dummy_zip_file.seek(0)

            mock_cvat_api.get_job_annotations.return_value = dummy_zip_file
            mock_cvat_api.get_project_annotations.return_value = dummy_zip_file
            mock_cloud_service.make_client.return_value.create_file.side_effect = _TestException()

            track_escrow_validations()

            mock_cloud_service.make_client.return_value.create_file.assert_called()

        webhook = (
            self.session.query(Webhook)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        assert webhook is None

        db_project = self.session.query(Project).filter_by(id=project_id).first()
        assert db_project.status == ProjectStatuses.validation

        db_validation = (
            self.session.query(EscrowValidation)
            .filter_by(escrow_address=escrow_address, chain_id=chain_id)
            .first()
        )
        assert db_validation.status == EscrowValidationStatuses.awaiting
        assert db_validation.attempts == 1

    def test_retrieve_annotations_multiple_projects_per_escrow_all_completed(self):
        escrow_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        project1, task1, job1 = create_project_task_and_job(self.session, escrow_address, 1)
        project2, task2, job2 = create_project_task_and_job(self.session, escrow_address, 2)
        project3, task3, job3 = create_project_task_and_job(self.session, escrow_address, 3)

        project1.job_type = TaskTypes.image_skeletons_from_boxes
        project2.job_type = TaskTypes.image_skeletons_from_boxes
        project3.job_type = TaskTypes.image_skeletons_from_boxes
        project1.status = ProjectStatuses.completed
        project2.status = ProjectStatuses.completed
        project3.status = ProjectStatuses.completed
        task1.status = TaskStatuses.completed
        task2.status = TaskStatuses.completed
        task3.status = TaskStatuses.completed
        job1.status = JobStatuses.completed
        job2.status = JobStatuses.completed
        job3.status = JobStatuses.completed

        project_images = ["sample1.jpg", "sample2.png"]
        for project in [project1, project2, project3]:
            for image_filename in project_images:
                self.session.add(
                    Image(
                        id=str(uuid.uuid4()),
                        cvat_project_id=project.cvat_id,
                        filename=image_filename,
                    )
                )

        self.session.add_all([project1, task1, job1, project2, task2, job2, project3, task3, job3])

        wallet_address = "0x86e83d346041E8806e352681f3F14549C0d2BC67"
        user = User(
            wallet_address=wallet_address,
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

        for job in [job1, job2, job3]:
            now = datetime.now()
            assignment = Assignment(
                id=str(uuid.uuid4()),
                user_wallet_address=wallet_address,
                cvat_job_id=job.cvat_id,
                expires_at=now + timedelta(days=1),
                completed_at=now - timedelta(hours=1),
                status=AssignmentStatuses.completed,
            )
            self.session.add(assignment)

        create_escrow_validations(self.session)

        self.session.commit()

        with (
            open("tests/utils/manifest.json") as manifest_data,
            patch("src.handlers.completed_escrows.get_escrow_manifest") as mock_get_manifest,
            patch("src.handlers.completed_escrows.validate_escrow"),
            patch("src.handlers.completed_escrows.cvat_api") as mock_cvat_api,
            patch("src.handlers.completed_escrows.cloud_service") as mock_cloud_service,
            patch(
                "src.handlers.completed_escrows.postprocess_annotations"
            ) as mock_postprocess_annotations,
        ):
            manifest = json.load(manifest_data)
            manifest["annotation"]["type"] = TaskTypes.image_skeletons_from_boxes

            mock_get_manifest.return_value = manifest

            def _fake_get_annotations(*args, **kwargs):
                dummy_zip_file = io.BytesIO()
                with (
                    zipfile.ZipFile(dummy_zip_file, "w") as archive,
                    TemporaryDirectory() as tempdir,
                ):
                    mock_dataset = dm.Dataset(
                        media_type=dm.Image,
                        categories={
                            dm.AnnotationType.label: dm.LabelCategories.from_iterable(
                                ["cat", "dog"]
                            )
                        },
                    )
                    for image_filename in project_images:
                        mock_dataset.put(dm.DatasetItem(id=os.path.splitext(image_filename)[0]))
                    mock_dataset.export(tempdir, format="cvat")

                    for filename in list(glob(os.path.join(tempdir, "**/*"), recursive=True)):
                        archive.write(filename, os.path.relpath(filename, tempdir))
                dummy_zip_file.seek(0)

                return dummy_zip_file

            mock_cvat_api.get_job_annotations.side_effect = _fake_get_annotations
            mock_cvat_api.get_project_annotations.side_effect = _fake_get_annotations

            def _fake_postprocess_annotations(
                escrow_address,
                chain_id,
                annotations,
                merged_annotation,
                *,
                manifest,
                project_images,
            ):
                merged_annotation.file = io.BytesIO()

            mock_postprocess_annotations.side_effect = _fake_postprocess_annotations

            mock_storage_client = Mock()
            mock_storage_client.create_file = Mock()
            mock_storage_client.list_files = Mock(return_value=[])
            mock_cloud_service.make_client = Mock(return_value=mock_storage_client)

            track_escrow_validations()

        webhook = (
            self.session.query(Webhook)
            .filter_by(escrow_address=escrow_address, chain_id=Networks.localhost)
            .first()
        )
        assert webhook is not None
        assert webhook.event_type == ExchangeOracleEventTypes.job_finished

        self.session.refresh(project1)
        self.session.refresh(project2)
        self.session.refresh(project3)
        for db_project in project1, project2, project3:
            assert db_project.status == ProjectStatuses.validation
