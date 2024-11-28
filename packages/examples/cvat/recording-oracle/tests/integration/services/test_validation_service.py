import io
import math
import random
import unittest
import uuid
from contextlib import ExitStack
from logging import Logger
from types import SimpleNamespace
from unittest import mock

import numpy as np
import pytest
from datumaro.util import take_by
from sqlalchemy.orm import Session

from src.core.annotation_meta import AnnotationMeta, JobMeta
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
from tests.utils.helpers import generate_manifest


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
    def test_can_handle_lowered_quality_requirements_in_manifest(self, session: Session):
        escrow_address = ESCROW_ADDRESS
        chain_id = Networks.localhost

        min_quality1 = 0.8
        min_quality2 = 0.5
        frame_count = 10

        manifest = generate_manifest(min_quality=min_quality1)

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

            common_lock_es.enter_context(
                mock.patch("src.handlers.process_intermediate_results.BucketAccessInfo.parse_obj")
            )

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


class TestValidationLogic:
    @pytest.mark.parametrize("seed", range(50))
    def test_can_change_bad_honeypots_in_jobs(self, session: Session, seed: int):
        escrow_address = ESCROW_ADDRESS
        chain_id = Networks.localhost

        # max excluded = job count * val per job / max val repeats =>
        # val count must be >= max_excluded + val per job
        max_validation_frame_uses = 2
        frame_count = 32
        validation_frames_per_job = 4
        validation_frames_count = 12
        job_size = 5
        assert (
            validation_frames_count
            >= math.ceil((frame_count - validation_frames_count) / job_size)
            * validation_frames_per_job
            // max_validation_frame_uses
            + validation_frames_per_job
        )

        manifest = generate_manifest(
            min_quality=0.8, job_size=job_size, validation_frames_per_job=validation_frames_per_job
        )

        (
            _,
            task_frame_names,
            task_validation_frames,
            task_honeypots,
            task_honeypot_real_frames,
            jobs,
        ) = self._generate_task_frames(
            frame_count,
            validation_frames_count,
            job_size,
            validation_frames_per_job,
            seed=seed,
            max_validation_frame_uses=max_validation_frame_uses,
        )
        job_frame_ranges = self._get_job_frame_ranges(jobs)

        cvat_task_id = 1

        annotator1 = WALLET_ADDRESS1
        assignment1_id = f"0x{0:040d}"

        # create a validation input
        with ExitStack() as common_lock_es:
            logger = mock.Mock(Logger)

            common_lock_es.enter_context(
                mock.patch(
                    "src.core.config.Config.validation.gt_ban_threshold", max_validation_frame_uses
                )
            )

            mock_make_cloud_client = common_lock_es.enter_context(
                mock.patch("src.handlers.process_intermediate_results.make_cloud_client")
            )
            mock_make_cloud_client.return_value.download_file = mock.Mock(return_value=b"")

            common_lock_es.enter_context(
                mock.patch("src.handlers.process_intermediate_results.BucketAccessInfo.parse_obj")
            )

            mock_get_task_validation_layout = common_lock_es.enter_context(
                mock.patch(
                    "src.handlers.process_intermediate_results.cvat_api.get_task_validation_layout"
                )
            )
            mock_get_task_validation_layout.return_value = mock.Mock(
                cvat_api.models.ITaskValidationLayoutRead,
                frames_per_job_count=validation_frames_per_job,
                validation_frames=task_validation_frames,
                disabled_frames=[],
                honeypot_count=len(task_honeypots),
                honeypot_frames=task_honeypots,
                honeypot_real_frames=task_honeypot_real_frames,
            )

            mock_get_task_data_meta = common_lock_es.enter_context(
                mock.patch("src.handlers.process_intermediate_results.cvat_api.get_task_data_meta")
            )
            mock_get_task_data_meta.return_value = mock.Mock(
                cvat_api.models.IDataMetaRead,
                frames=[SimpleNamespace(name=name) for name in task_frame_names],
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
                        job_id=1 + i,
                        task_id=cvat_task_id,
                        annotation_filename="",
                        annotator_wallet_address=annotator1,
                        assignment_id=assignment1_id,
                        start_frame=job_start,
                        stop_frame=job_stop,
                    )
                    for i, (job_start, job_stop) in enumerate(job_frame_ranges)
                ]
            )

            rng = np.random.Generator(np.random.MT19937(seed))
            rng.shuffle(annotation_meta.jobs)

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
                mock.patch(
                    "src.handlers.process_intermediate_results.cvat_api.update_task_validation_layout"
                ) as mock_update_task_validation_layout,
            ):
                mock_get_task_quality_report.return_value = mock.Mock(
                    cvat_api.models.IQualityReport, id=1
                )

                mock_get_quality_report_data.return_value = mock.Mock(
                    cvat_api.QualityReportData,
                    frame_results={
                        str(honeypot_frame): mock.Mock(annotations=mock.Mock(accuracy=0))
                        for honeypot_frame in task_honeypots
                    },
                )

                mock_get_jobs_quality_reports.return_value = [
                    mock.Mock(
                        cvat_api.models.IQualityReport,
                        job_id=1 + i,
                        summary=mock.Mock(accuracy=0),
                    )
                    for i in range(len(jobs))
                ]

                vr = process_intermediate_results(
                    session,
                    escrow_address=escrow_address,
                    chain_id=chain_id,
                    meta=annotation_meta,
                    merged_annotations=io.BytesIO(),
                    manifest=manifest,
                    logger=logger,
                )

                assert isinstance(vr, ValidationFailure)

                assert mock_update_task_validation_layout.call_count == 1

                updated_disabled_frames = mock_update_task_validation_layout.call_args.kwargs[
                    "disabled_frames"
                ]
                assert all(v in task_validation_frames for v in updated_disabled_frames)

                updated_honeypot_real_frames = mock_update_task_validation_layout.call_args.kwargs[
                    "honeypot_real_frames"
                ]

                for job_start, job_stop in job_frame_ranges:
                    job_honeypot_positions = [
                        i
                        for i, v in enumerate(task_honeypots)
                        if v in range(job_start, job_stop + 1)
                    ]
                    job_updated_honeypots = [
                        updated_honeypot_real_frames[i] for i in job_honeypot_positions
                    ]
                    assert sorted(job_updated_honeypots) == sorted(set(job_updated_honeypots))

    def _get_job_frame_ranges(self, jobs) -> list[tuple[int, int]]:
        job_frame_ranges = []
        job_start = 0
        for job_frames in jobs:
            job_stop = job_start + len(job_frames) - 1
            job_frame_ranges.append((job_start, job_stop))
            job_start = job_stop + 1

        return job_frame_ranges

    def _generate_task_frames(
        self,
        frame_count,
        validation_frames_count,
        job_size,
        validation_frames_per_job,
        seed,
        max_validation_frame_uses=None,
    ):
        rng = np.random.Generator(np.random.MT19937(seed))
        task_frames = list(range(frame_count))
        task_validation_frames = task_frames[-validation_frames_count:]
        task_real_frames = []
        task_honeypots = []
        task_honeypot_real_frames = []
        validation_frame_uses = {vf: 0 for vf in task_validation_frames}
        jobs = []
        for job_real_frames in take_by(
            task_frames[: frame_count - validation_frames_count], job_size
        ):
            available_validation_frames = [
                vf
                for vf in task_validation_frames
                if not max_validation_frame_uses
                or validation_frame_uses[vf] < max_validation_frame_uses
            ]
            job_validation_frames = rng.choice(
                available_validation_frames, validation_frames_per_job, replace=False
            ).tolist()

            job_real_frames = job_real_frames + job_validation_frames
            rng.shuffle(job_real_frames)

            jobs.append(job_real_frames)

            job_start_frame = len(task_real_frames)
            task_real_frames.extend(job_real_frames)

            for i, v in enumerate(job_real_frames):
                if v in job_validation_frames:
                    task_honeypots.append(i + job_start_frame)
                    task_honeypot_real_frames.append(v)

        task_frame_names = list(map(str, task_real_frames))
        return (
            task_real_frames,
            task_frame_names,
            task_validation_frames,
            task_honeypots,
            task_honeypot_real_frames,
            jobs,
        )
