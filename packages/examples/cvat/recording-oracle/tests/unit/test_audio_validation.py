import json
import logging
from collections.abc import Callable
from pathlib import Path
from types import SimpleNamespace

import pytest
from sqlalchemy.orm import Session

from src.core.annotation_meta import AnnotationMeta, JobMeta
from src.core.config import Config
from src.core.manifest import parse_manifest
from src.core.storage import (
    compose_data_bucket_filename,
    compose_data_bucket_prefix,
    compose_results_bucket_filename,
    compose_results_bucket_prefix,
)
from src.core.tasks.audio_transcription.meta import (
    Clip,
    TaskMetaLayout,
    TaskMetaSerializer,
    TaskResultsLayout,
)
from src.core.types import Networks
from src.core.validation_results import ValidationFailure, ValidationSuccess
from src.handlers.validation import process_intermediate_results
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo

from tests.utils.audio_transcription import (
    TRANSCRIPTION_ATTR,
    build_empty_annotation,
    build_perfect_annotation,
    gt_regions_by_id,
)
from tests.utils.constants import ESCROW_ADDRESS, WALLET_ADDRESS1

CHAIN_ID = Networks.localhost.value

# Real exchange-oracle builder output. Regenerate by
# exchange-oracle/tests/assets/utils/gen_audio_validation_fixture.py
FIXTURE_DIR = Path(__file__).resolve().parents[1] / "assets" / "cloud" / "audio_validation"

MANIFEST_FILENAME = "manifest.json"


def _load_manifest():
    return parse_manifest(json.loads((FIXTURE_DIR / MANIFEST_FILENAME).read_text()))


def _cleanup_eo_bucket():
    client = make_cloud_client(BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config))
    client.remove_files(prefix=compose_data_bucket_prefix(ESCROW_ADDRESS, CHAIN_ID))
    client.remove_files(prefix=compose_results_bucket_prefix(ESCROW_ADDRESS, CHAIN_ID))


@pytest.fixture
def pre_cleanup_eo_bucket():
    _cleanup_eo_bucket()


@pytest.fixture
def post_cleanup_eo_bucket():
    yield
    _cleanup_eo_bucket()


@pytest.fixture
def fxt_published_task(pre_cleanup_eo_bucket):
    """Publish the golden builder metadata to the exchange-oracle bucket the validator reads."""

    client = make_cloud_client(BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config))

    gt_tsv = (FIXTURE_DIR / TaskMetaLayout.GT_FILENAME).read_text()
    clips_data = (FIXTURE_DIR / TaskMetaLayout.CLIPS_FILENAME).read_bytes()
    task_clips_data = (FIXTURE_DIR / TaskMetaLayout.TASK_CLIPS_FILENAME).read_bytes()

    for filename, data in (
        (TaskMetaLayout.GT_FILENAME, gt_tsv.encode()),
        (TaskMetaLayout.CLIPS_FILENAME, clips_data),
        (TaskMetaLayout.TASK_CLIPS_FILENAME, task_clips_data),
    ):
        client.create_file(compose_data_bucket_filename(ESCROW_ADDRESS, CHAIN_ID, filename), data)

    serializer = TaskMetaSerializer()
    return SimpleNamespace(
        client=client,
        clips_by_id={clip.id: clip for clip in serializer.parse_clips(clips_data)},
        task_clips=serializer.parse_task_clips(task_clips_data),
        gt=gt_regions_by_id(gt_tsv),
    )


@pytest.mark.usefixtures("post_cleanup_eo_bucket")
class AudioValidationTest:
    def _validate(self, session: Session, published_task, build_annotation: Callable[[Clip], str]):
        """Upload one annotator submission per CVAT task and run the intermediate-results flow.

        ``build_annotation`` maps a clip to its submission TSV. Returns the validation result and
        the job metas (their ``job_id`` keys the result).
        """

        jobs = []
        for job_id, (task_id, clip_id) in enumerate(
            sorted(published_task.task_clips.items()), start=1
        ):
            assignment_id = f"assignment-{job_id}"
            published_task.client.create_file(
                compose_results_bucket_filename(
                    ESCROW_ADDRESS,
                    CHAIN_ID,
                    TaskResultsLayout.assignment_annotation_filename(job_id, assignment_id),
                ),
                build_annotation(published_task.clips_by_id[clip_id]).encode(),
            )
            jobs.append(
                JobMeta(
                    job_id=job_id,
                    task_id=task_id,
                    annotator_wallet_address=WALLET_ADDRESS1,
                    assignment_id=assignment_id,
                    start_frame=0,
                    stop_frame=0,
                )
            )

        result = process_intermediate_results(
            session=session,
            escrow_address=ESCROW_ADDRESS,
            chain_id=CHAIN_ID,
            meta=AnnotationMeta(jobs=jobs),
            manifest=_load_manifest(),
            logger=logging.getLogger(__name__),
        )

        return result, jobs

    def test_can_pass_validation(self, session: Session, fxt_published_task):
        result, jobs = self._validate(
            session,
            fxt_published_task,
            lambda clip: build_perfect_annotation(
                clip, fxt_published_task.gt, transcription_attr=TRANSCRIPTION_ATTR
            ),
        )

        # No rejections -> the escrow completes with a 0.0 (perfect) score per job.
        assert isinstance(result, ValidationSuccess)
        assert result.job_results == {job.job_id: 0.0 for job in jobs}

    def test_can_fail_validation(self, session: Session, fxt_published_task):
        result, jobs = self._validate(
            session,
            fxt_published_task,
            lambda _clip: build_empty_annotation(TRANSCRIPTION_ATTR),
        )

        # Every honeypot is a full deletion -> rate 1.0 > the 0.5 target, so every job is rejected.
        assert isinstance(result, ValidationFailure)
        assert set(result.rejected_jobs) == {job.job_id for job in jobs}
        assert result.job_results == {job.job_id: 1.0 for job in jobs}
