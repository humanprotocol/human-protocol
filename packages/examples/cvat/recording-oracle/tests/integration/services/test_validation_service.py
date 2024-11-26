import io
import random
import unittest
import uuid
from contextlib import ExitStack
from logging import Logger
from types import SimpleNamespace
from unittest import mock

from sqlalchemy.orm import Session

from src.core.annotation_meta import AnnotationMeta, JobMeta
from src.core.manifest import TaskManifest, parse_manifest
from src.core.types import Networks
from src.core.validation_results import ValidationFailure, ValidationSuccess
from src.cvat import api_calls as cvat_api
from src.db import SessionLocal
from src.handlers.process_intermediate_results import process_intermediate_results
from src.services.validation import (
    create_job,
    create_task,
    create_validation_result,
    get_job_by_cvat_id,
    get_job_by_id,
    get_task_by_escrow_address,
    get_task_by_id,
    get_task_validation_results,
    get_validation_result_by_assignment_id,
)

from tests.utils.constants import ESCROW_ADDRESS, WALLET_ADDRESS1


class ServiceIntegrationTest(unittest.TestCase):
    def setUp(self):
        random.seed(42)
        self.session = SessionLocal()
        self.escrow_address = ESCROW_ADDRESS
        self.chain_id = Networks.localhost
        self.cvat_id = 0
        self.annotator_wallet_address = WALLET_ADDRESS1
        self.annotation_quality = 0.9
        self.assignment_id = str(uuid.uuid4())

    def tearDown(self):
        self.session.close()

    def test_create_and_get_task(self):
        task_id = create_task(
            session=self.session, escrow_address=self.escrow_address, chain_id=self.chain_id
        )

        task = get_task_by_id(self.session, task_id)
        assert task.chain_id == self.chain_id
        assert task.escrow_address == self.escrow_address

        other_task = get_task_by_escrow_address(self.session, self.escrow_address)
        assert task.id == other_task.id

    def test_create_and_get_job(self):
        task_id = create_task(
            session=self.session, escrow_address=self.escrow_address, chain_id=self.chain_id
        )
        job_id = create_job(self.session, self.cvat_id, task_id)

        job = get_job_by_cvat_id(self.session, self.cvat_id)
        assert job.task_id == task_id

        other_job = get_job_by_id(self.session, job_id)
        assert job == other_job

    def test_create_and_get_validation_result(self):
        task_id = create_task(
            session=self.session, escrow_address=self.escrow_address, chain_id=self.chain_id
        )
        job_id = create_job(self.session, self.cvat_id, task_id)
        vr_id = create_validation_result(
            self.session,
            job_id,
            self.annotator_wallet_address,
            self.annotation_quality,
            self.assignment_id,
        )

        vr = get_validation_result_by_assignment_id(self.session, self.assignment_id)
        assert vr.id == vr_id

        vrs = get_task_validation_results(self.session, task_id)
        assert len(vrs) == 1
        assert vrs[0] == vr


class TestManifestChange:
    @staticmethod
    def _generate_manifest(*, min_quality: float = 0.8) -> TaskManifest:
        data = {
            "data": {"data_url": "http://localhost:9010/datasets/sample"},
            "annotation": {
                "labels": [{"name": "person"}],
                "description": "",
                "user_guide": "",
                "type": "image_points",
                "job_size": 10,
            },
            "validation": {
                "min_quality": min_quality,
                "val_size": 2,
                "gt_url": "http://localhost:9010/datasets/sample/annotations/sample_gt.json",
            },
            "job_bounty": "0.0001",
        }

        return parse_manifest(data)

    def test_can_handle_lowered_quality_requirements_in_manifest(self, session: Session):
        escrow_address = ESCROW_ADDRESS
        chain_id = Networks.localhost

        min_quality1 = 0.8
        min_quality2 = 0.5
        frame_count = 10

        manifest = self._generate_manifest(min_quality=min_quality1)

        cvat_task_id = 1
        cvat_job_id = 1
        annotator1 = WALLET_ADDRESS1

        assignment1_id = f"0x{0:040d}"
        assignment1_quality = 0.7

        assignment2_id = f"0x{1:040d}"
        assignment2_quality = 0.6

        # create a validation input
        with ExitStack() as common_lock_es:
            logger = mock.Mock(Logger)

            mock_make_cloud_client = common_lock_es.enter_context(
                mock.patch("src.handlers.process_intermediate_results.make_cloud_client")
            )
            mock_make_cloud_client.return_value.download_file = mock.Mock(return_value=b"")

            mock_get_task_validation_layout = common_lock_es.enter_context(
                mock.patch(
                    "src.handlers.process_intermediate_results.cvat_api.get_task_validation_layout"
                )
            )
            mock_get_task_validation_layout.return_value = mock.Mock(
                cvat_api.models.ITaskValidationLayoutRead,
                honeypot_frames=[0, 1],
                honeypot_real_frames=[0, 1],
            )

            mock_get_task_data_meta = common_lock_es.enter_context(
                mock.patch("src.handlers.process_intermediate_results.cvat_api.get_task_data_meta")
            )
            mock_get_task_data_meta.return_value = mock.Mock(
                cvat_api.models.IDataMetaRead,
                frames=[SimpleNamespace(name=f"frame_{i}.jpg") for i in range(frame_count)],
            )

            common_lock_es.enter_context(
                mock.patch("src.handlers.process_intermediate_results.dm.Dataset.import_from")
            )
            common_lock_es.enter_context(
                mock.patch("src.handlers.process_intermediate_results.extract_zip_archive")
            )
            common_lock_es.enter_context(
                mock.patch("src.handlers.process_intermediate_results.write_dir_to_zip_archive")
            )

            def patched_prepare_merged_dataset(self):
                self._updated_merged_dataset_archive = io.BytesIO()

            common_lock_es.enter_context(
                mock.patch(
                    "src.handlers.process_intermediate_results._TaskValidator._prepare_merged_dataset",
                    patched_prepare_merged_dataset,
                )
            )

            annotation_meta = AnnotationMeta(
                jobs=[
                    JobMeta(
                        job_id=cvat_job_id,
                        task_id=cvat_task_id,
                        annotation_filename="",
                        annotator_wallet_address=annotator1,
                        assignment_id=assignment1_id,
                        start_frame=0,
                        stop_frame=manifest.annotation.job_size + manifest.validation.val_size,
                    )
                ]
            )

            with (
                mock.patch(
                    "src.handlers.process_intermediate_results.cvat_api.get_task_quality_report"
                ) as mock_get_task_quality_report,
                mock.patch(
                    "src.handlers.process_intermediate_results.cvat_api.get_quality_report_data"
                ) as mock_get_quality_report_data,
                mock.patch(
                    "src.handlers.process_intermediate_results.cvat_api.get_jobs_quality_reports"
                ) as mock_get_jobs_quality_reports,
            ):
                mock_get_task_quality_report.return_value = mock.Mock(
                    cvat_api.models.IQualityReport, id=1
                )
                mock_get_quality_report_data.return_value = mock.Mock(
                    cvat_api.QualityReportData,
                    frame_results={
                        "0": mock.Mock(annotations=mock.Mock(accuracy=assignment1_quality)),
                        "1": mock.Mock(annotations=mock.Mock(accuracy=assignment1_quality)),
                    },
                )
                mock_get_jobs_quality_reports.return_value = [
                    mock.Mock(
                        cvat_api.models.IQualityReport,
                        job_id=1,
                        summary=mock.Mock(accuracy=assignment1_quality),
                    ),
                ]

                vr1 = process_intermediate_results(
                    session,
                    escrow_address=escrow_address,
                    chain_id=chain_id,
                    meta=annotation_meta,
                    merged_annotations=io.BytesIO(),
                    manifest=manifest,
                    logger=logger,
                )

            assert isinstance(vr1, ValidationFailure)
            assert len(vr1.rejected_jobs) == 1

            manifest.validation.min_quality = min_quality2

            annotation_meta.jobs[0].assignment_id = assignment2_id

            with (
                mock.patch(
                    "src.handlers.process_intermediate_results.cvat_api.get_task_quality_report"
                ) as mock_get_task_quality_report,
                mock.patch(
                    "src.handlers.process_intermediate_results.cvat_api.get_quality_report_data"
                ) as mock_get_quality_report_data,
                mock.patch(
                    "src.handlers.process_intermediate_results.cvat_api.get_jobs_quality_reports"
                ) as mock_get_jobs_quality_reports,
            ):
                mock_get_task_quality_report.return_value = mock.Mock(
                    cvat_api.models.IQualityReport, id=2
                )
                mock_get_quality_report_data.return_value = mock.Mock(
                    cvat_api.QualityReportData,
                    frame_results={
                        "0": mock.Mock(annotations=mock.Mock(accuracy=assignment2_quality)),
                        "1": mock.Mock(annotations=mock.Mock(accuracy=assignment2_quality)),
                    },
                )
                mock_get_jobs_quality_reports.return_value = [
                    mock.Mock(
                        cvat_api.models.IQualityReport,
                        job_id=1,
                        summary=mock.Mock(accuracy=assignment2_quality),
                    ),
                ]

                vr2 = process_intermediate_results(
                    session,
                    escrow_address=escrow_address,
                    chain_id=chain_id,
                    meta=annotation_meta,
                    merged_annotations=io.BytesIO(),
                    manifest=manifest,
                    logger=logger,
                )

        assert isinstance(vr2, ValidationSuccess)
        assert vr2.job_results[cvat_job_id] == assignment2_quality

        assert len(vr2.validation_meta.jobs) == 1
        assert len(vr2.validation_meta.results) == 2
        assert (
            vr2.validation_meta.results[
                vr2.validation_meta.jobs[0].final_result_id
            ].annotation_quality
            == assignment2_quality
        )
