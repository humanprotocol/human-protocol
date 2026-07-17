"""Regenerate the recording-oracle audio-validation fixture.

Recording Oracle validates audio-transcription assignments against the metadata the exchange oracle
produces during task creation.

Run this script whenever the builder output layout or the shared audio task setup
(``tests.utils.audio_transcription``) changes.

Easiest is to run it inside the test suite container. It reuses the test service, and writes the
fixture to a mounted output dir. Call from the exchange-oracle dir:

    docker compose -p eo-test \
      -f docker-compose.test.yml \\ -f docker-compose.test.head.yml \\ -f
      docker-compose.test.head.dev.yml \\ run --rm \\ -v
      "$(pwd)/../recording-oracle/tests/assets/cloud/audio_validation:/out" \\ test sh -c "alembic
      upgrade head && PYTHONPATH=. \
        python tests/assets/utils/gen_audio_validation_fixture.py /out"

If you want to run it directly, launch the test services, export the same env vars the test service
sets (see docker-compose.test.head.yml), apply migrations (``alembic upgrade head``), then:

    PYTHONPATH=. python tests/assets/utils/gen_audio_validation_fixture.py [OUTPUT_DIR]
"""

from __future__ import annotations

import tempfile
from pathlib import Path

INPUT_BUCKET = "datasets"
INPUT_PREFIX = "audio_validation_fixture"

# The manifest the fixture is built from, vendored alongside it for the RO test.
MANIFEST_FILENAME = "manifest.json"

# Default output: the RO assets tree, resolved relative to this file
# (exchange-oracle/tests/assets/utils/ -> recording-oracle/). Override with a positional arg.
DEFAULT_OUTPUT_DIR = (
    Path(__file__).resolve().parents[4]
    / "recording-oracle"
    / "tests"
    / "assets"
    / "cloud"
    / "audio_validation"
)


def main(output_dir: Path = DEFAULT_OUTPUT_DIR) -> None:
    # Imported lazily: src.core.config reads storage env vars at import time, so keeping these out
    # of module scope lets --help / the docstring be read without the test-suite env defined.
    import json
    from unittest.mock import patch

    from src.core.config import Config
    from src.core.manifest import parse_manifest
    from src.core.storage import compose_data_bucket_filename, compose_data_bucket_prefix
    from src.core.tasks.audio_transcription.meta import TaskMetaLayout
    from src.core.types import Networks
    from src.handlers.job_creation import handlers
    from src.services.cloud.utils import BucketAccessInfo, make_client

    from tests.unit.test_audio_task_creation import (
        MANIFEST_PATH,
        _generate_wav,
        _make_bucket_url,
        _make_cvat_api_mock,
    )
    from tests.utils.audio_transcription import (
        MEDIA_DURATION_S,
        MEDIA_FILES,
        build_gt_tsv,
        build_regions_tsv,
    )
    from tests.utils.constants import ESCROW_ADDRESS

    chain_id = Networks.localhost.value

    # The builder-produced metadata the RO validation consumes.
    fixture_files = (
        TaskMetaLayout.GT_FILENAME,
        TaskMetaLayout.CLIPS_FILENAME,
        TaskMetaLayout.TASK_CLIPS_FILENAME,
    )

    def data_url(name: str):
        return _make_bucket_url(f"{INPUT_PREFIX}/{name}", bucket_name=INPUT_BUCKET)

    def build_manifest():
        with open(MANIFEST_PATH) as f:
            manifest = json.load(f)
        manifest["data"] = {
            "media_url": data_url("media"),
            "regions_url": data_url("regions.tsv"),
            "gt_url": data_url("gt.tsv"),
        }
        return manifest

    def upload_input(tmp_dir: Path):
        manifest = build_manifest()
        client = make_client(BucketAccessInfo.parse_obj(parse_manifest(manifest).data.media_url))
        for filename in MEDIA_FILES:
            wav_path = tmp_dir / filename
            _generate_wav(wav_path, duration_s=MEDIA_DURATION_S)
            client.create_file(f"{INPUT_PREFIX}/media/{filename}", wav_path.read_bytes())
        client.create_file(f"{INPUT_PREFIX}/regions.tsv", build_regions_tsv().encode())
        client.create_file(f"{INPUT_PREFIX}/gt.tsv", build_gt_tsv().encode())
        return manifest, client

    output_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        manifest, input_client = upload_input(Path(tmp))

        cvat_api = _make_cvat_api_mock()
        with (
            patch.object(handlers, "get_escrow_manifest", return_value=manifest),
            patch("src.handlers.job_creation.builders.audio.transcription.cvat_api", cvat_api),
        ):
            handlers.create_task(ESCROW_ADDRESS, chain_id)

        oracle_client = make_client(BucketAccessInfo.parse_obj(Config.storage_config))
        try:
            for filename in fixture_files:
                data = oracle_client.download_file(
                    compose_data_bucket_filename(ESCROW_ADDRESS, chain_id, filename)
                )
                (output_dir / filename).write_bytes(data)
                print(f"wrote {output_dir / filename} ({len(data)} bytes)")

            # Vendor the manifest the fixture was built from, so the RO validation runs against the
            # exact same task config (metric, normalizer, tolerances) that produced it.
            manifest_out = output_dir / MANIFEST_FILENAME
            manifest_out.write_bytes(Path(MANIFEST_PATH).read_bytes())
            print(f"wrote {manifest_out} ({manifest_out.stat().st_size} bytes)")
        finally:
            # Best-effort cleanup of the buckets this run touched.
            input_client.remove_files(prefix=INPUT_PREFIX)
            oracle_client.remove_files(prefix=compose_data_bucket_prefix(ESCROW_ADDRESS, chain_id))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "output_dir",
        nargs="?",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="directory to write the fixture into (default: the recording-oracle assets tree)",
    )
    main(parser.parse_args().output_dir)
