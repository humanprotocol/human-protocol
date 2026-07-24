import json
import subprocess
from decimal import Decimal
from pathlib import Path
from unittest.mock import Mock, patch

import pytest

import src.services.cvat as db_service
from src.core.config import Config
from src.core.manifest import parse_manifest
from src.core.storage import compose_data_bucket_prefix
from src.core.tasks import TaskTypes
from src.core.tasks.audio_transcription.meta import (
    RegionKind,
    TaskMetaLayout,
    TaskMetaSerializer,
    parse_gt_tsv,
)
from src.core.types import Networks, TaskStatuses
from src.handlers.job_creation import handlers
from src.handlers.job_creation.builders.audio.transcription import _parse_regions_tsv
from src.services.cloud.utils import BucketAccessInfo, make_client

from tests.utils.audio_transcription import (
    MEDIA_DURATION_S,
    MEDIA_FILES,
    build_gt_tsv,
    build_regions_tsv,
)
from tests.utils.constants import ESCROW_ADDRESS
from tests.utils.setup_cvat import get_session

CHAIN_ID = Networks.localhost.value

MANIFEST_PATH = "tests/assets/cloud/manifests/audio_manifest.json"


def _generate_wav(path: Path, *, duration_s: int) -> None:
    """Synthesize a mono sine-tone WAV on the fly (ffmpeg is present in the test image)."""
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=440:duration={duration_s}",
            "-ar",
            "48000",
            "-ac",
            "1",
            str(path),
        ],
        check=True,
    )


def _make_bucket_url(path: str, *, bucket_name: str) -> dict:
    cfg = Config.storage_config

    return {
        "provider": cfg.provider.upper(),
        "host_url": f"{cfg.get_scheme()}{cfg.endpoint_url}",
        "bucket_name": bucket_name,
        "path": path,
        "access_key": cfg.access_key,
        "secret_key": cfg.secret_key,
    }


@pytest.fixture
def fxt_audio_transcription_input(tmp_path: Path):
    """Factory: generate the media recordings + region/GT TSVs, upload them to the input bucket, and
    return a manifest whose data URLs embed the minio connection details. The region/GT layout is
    caller-provided so tests exercising different assignment counts can reuse this."""

    input_bucket = "datasets"
    input_prefix = "audio_test"

    ds_rois_tsv = build_regions_tsv()
    gt_tsv = build_gt_tsv()

    with open(MANIFEST_PATH) as f:
        manifest = json.load(f)

    manifest["data"] = {
        "media_url": _make_bucket_url(f"{input_prefix}/media", bucket_name=input_bucket),
        "regions_url": _make_bucket_url(f"{input_prefix}/regions.tsv", bucket_name=input_bucket),
        "gt_url": _make_bucket_url(f"{input_prefix}/gt.tsv", bucket_name=input_bucket),
    }

    try:
        client = make_client(BucketAccessInfo.parse_obj(parse_manifest(manifest).data.media_url))
        for filename in MEDIA_FILES:
            wav_path = tmp_path / filename
            _generate_wav(wav_path, duration_s=MEDIA_DURATION_S)
            client.create_file(f"{input_prefix}/media/{filename}", wav_path.read_bytes())

        client.create_file(f"{input_prefix}/regions.tsv", ds_rois_tsv.encode())
        client.create_file(f"{input_prefix}/gt.tsv", gt_tsv.encode())

        yield manifest, ds_rois_tsv, gt_tsv
    finally:
        client.remove_files(prefix=input_prefix)


def _make_cvat_api_mock() -> Mock:
    """A cvat_api stand-in returning integer ids so the DB inserts succeed, and a fresh
    task id per create_task call so the unique cvat_id constraint holds."""
    cvat_api = Mock()
    cvat_api.create_project.return_value = Mock(id=1)
    cvat_api.create_cvat_webhook.return_value = Mock(id=10)
    cvat_api.create_cloudstorage.return_value = Mock(id=100)

    task_ids = iter(range(1000, 2000))
    cvat_api.create_task.side_effect = lambda *_a, **_kw: Mock(
        id=next(task_ids), status=TaskStatuses.annotation.value
    )
    return cvat_api


def cleanup_oracle_bucket(prefix: str = ""):
    storage_client = make_client(BucketAccessInfo.parse_obj(Config.storage_config))
    storage_client.remove_files(prefix=prefix)


@pytest.fixture
def post_cleanup_oracle_bucket():
    yield
    cleanup_oracle_bucket()


@pytest.fixture
def pre_cleanup_oracle_bucket():
    cleanup_oracle_bucket()


@pytest.mark.usefixtures("pre_cleanup_oracle_bucket")
@pytest.mark.usefixtures("post_cleanup_oracle_bucket")
def test_create_audio_transcription_task(fxt_audio_transcription_input):
    manifest, ds_rois_tsv, gt_tsv = fxt_audio_transcription_input

    cvat_api = _make_cvat_api_mock()
    with (
        patch.object(handlers, "get_escrow_manifest", return_value=manifest),
        patch("src.handlers.job_creation.builders.audio.transcription.cvat_api", cvat_api),
        patch(
            "src.handlers.job_creation.utils.get_remaining_escrow_funds",
            return_value=Decimal(40),
        ) as mock_remaining_funds,
    ):
        handlers.create_task(ESCROW_ADDRESS, CHAIN_ID)

    # v2 manifest → per-assignment bounty derived from escrow funds / job count
    mock_remaining_funds.assert_called_once_with(CHAIN_ID, ESCROW_ADDRESS)

    # Check CVAT API calls
    cvat_api.create_project.assert_called_once()
    cvat_api.create_cvat_webhook.assert_called_once()
    cvat_api.create_cloudstorage.assert_called_once()

    assignment_count = cvat_api.create_task.call_count
    assert assignment_count == 4
    assert cvat_api.put_task_data.call_count == assignment_count

    # Check DB records
    with get_session() as session:
        project = db_service.get_project_by_escrow_address(session, ESCROW_ADDRESS)
        assert project is not None
        assert project.cvat_id == 1
        assert project.cvat_webhook_id == 10
        assert project.cvat_cloudstorage_id == 100
        assert project.job_type == TaskTypes.audio_transcription.value
        assert project.chain_id == CHAIN_ID
        assert project.assignment_bounty == "10"  # 40 tokens remaining / 4 assignments

        tasks = db_service.get_tasks_by_cvat_project_id(session, project.cvat_id)
        assert len(tasks) == assignment_count

        # create_task only registers the escrow creation; it is finished later by the cron once
        # CVAT confirms the jobs, so it is still active (finished_at is None) at this point.
        escrow_creation = db_service.get_escrow_creation_by_escrow_address(
            session, ESCROW_ADDRESS, CHAIN_ID, active=True
        )
        assert escrow_creation.total_jobs == assignment_count

    # Check oracle bucket
    storage_client = make_client(BucketAccessInfo.parse_obj(Config.storage_config))
    storage_prefix = compose_data_bucket_prefix(ESCROW_ADDRESS, CHAIN_ID)
    storage_keys = set(storage_client.list_files(prefix=storage_prefix, trim_prefix=True))

    layout = TaskMetaLayout()
    clips = [k for k in storage_keys if k.startswith(f"{layout.CLIPS_DIR}/") and k.endswith(".wav")]
    assert len(clips) == assignment_count

    for meta_file in (
        layout.REGIONS_TSV_FILENAME,
        layout.GT_FILENAME,
        layout.REGIONS_FILENAME,
        layout.CLIPS_FILENAME,
        layout.TASK_CLIPS_FILENAME,
    ):
        assert meta_file in storage_keys, f"missing {meta_file} in {sorted(storage_keys)}"

    # task_clips maps each created CVAT task id to its assignment clip id
    task_clips = json.loads(
        storage_client.download_file(f"{storage_prefix}/{layout.TASK_CLIPS_FILENAME}")
    )
    assert len(task_clips) == assignment_count

    # Verify the input regions & GT were consumed as expected

    # The raw region/GT TSVs are copied verbatim to the oracle bucket for provenance.
    assert (
        storage_client.download_file(f"{storage_prefix}/{layout.REGIONS_TSV_FILENAME}").decode()
        == ds_rois_tsv
    )
    assert storage_client.download_file(f"{storage_prefix}/{layout.GT_FILENAME}").decode() == gt_tsv

    # Expected input ROI ids, reconstructed from the fixture TSVs with the production parsers.
    regions_by_file = _parse_regions_tsv(ds_rois_tsv.encode())
    input_media = set(regions_by_file)
    expected_ds_ids = sorted(r.id for regions in regions_by_file.values() for r in regions)

    gt_rois = parse_gt_tsv(gt_tsv.encode())
    expected_gt_ids = {r.id for r in gt_rois}
    span_by_gt_id = {r.id: r.span_id for r in gt_rois}

    serializer = TaskMetaSerializer()
    presented = serializer.parse_regions(
        storage_client.download_file(f"{storage_prefix}/{layout.REGIONS_FILENAME}")
    )
    ds_regions = [r for r in presented if r.kind == RegionKind.ds]
    gt_regions = [r for r in presented if r.kind == RegionKind.gt]

    # Presented regions reference only the input media
    assert {r.source_filename for r in presented} <= input_media

    # Every input DS ROI is presented for annotation exactly once
    presented_ds_ids = [region_id for r in ds_regions for region_id in r.input_ids]
    assert sorted(presented_ds_ids) == expected_ds_ids

    # val_fraction=1.0 -> all GT regions become honeypots, each used once, bundled within one span
    presented_gt_ids = [region_id for r in gt_regions for region_id in r.input_ids]
    assert sorted(presented_gt_ids) == sorted(expected_gt_ids)
    for r in gt_regions:
        assert len({span_by_gt_id[region_id] for region_id in r.input_ids}) == 1

    # Verify the assignment composition
    clips = serializer.parse_clips(
        storage_client.download_file(f"{storage_prefix}/{layout.CLIPS_FILENAME}")
    )
    assert len(clips) == assignment_count

    placed_ds_ids: list[str] = []
    placed_gt_ids: list[str] = []
    for clip in clips:
        kinds = {p.kind for p in clip.placed}
        assert RegionKind.ds in kinds, "assignment has no DS work"
        assert RegionKind.gt in kinds, "assignment has no GT honeypot"
        for p in clip.placed:
            (placed_ds_ids if p.kind == RegionKind.ds else placed_gt_ids).extend(p.input_ids)

    # Each DS ROI is annotated exactly once across all assignments.
    assert sorted(placed_ds_ids) == expected_ds_ids
    # Honeypots are drawn from the presented GT pool (and may repeat across assignments).
    assert placed_gt_ids
    assert set(placed_gt_ids) <= expected_gt_ids
