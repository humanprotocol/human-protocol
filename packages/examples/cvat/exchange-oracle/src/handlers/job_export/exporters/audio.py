from __future__ import annotations

import csv
import io
from datetime import timedelta
from typing import TYPE_CHECKING

import src.services.cvat as cvat_service
from src.core.config import Config
from src.core.storage import compose_data_bucket_filename
from src.core.tasks.audio_transcription.meta import (
    CVAT_EXPORT_FORMAT,
    TaskMetaLayout,
    TaskMetaSerializer,
    TaskResultsLayout,
    format_time,
    parse_time,
)
from src.core.tasks.audio_transcription.spec import parse_audio_manifest
from src.handlers.job_export.downloading import download_job_annotations
from src.handlers.job_export.exporters.base import JobExporter
from src.handlers.job_export.results import (
    FileDescriptor,
    prepare_annotation_metafile,
    upload_escrow_results,
)
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo

if TYPE_CHECKING:
    from src.core.tasks.audio_transcription.meta import Assignment, PlacedRegion


_LEADING_COLUMNS = ["id", "input_region_ids", "filename", "start", "stop", "label"]


class AudioTranscriptionJobExporter(JobExporter):
    def export(self) -> None:
        assert self.escrow_projects  # unused, but must hold the lock

        jobs = cvat_service.get_jobs_by_escrow_address(
            self.session, self.escrow_address, self.chain_id
        )

        spec = parse_audio_manifest(self.manifest)
        attr_names = [
            spec.details.transcription_attr_name,
            *(a.name for a in spec.shared_attributes),
        ]

        assignments_by_clip = self._load_assignments()

        # TODO: use project export when CVAT supports it to speedup downloading
        self.logger.debug(f"Downloading annotations for the escrow ({self.escrow_address=})")
        job_annotations = download_job_annotations(self.logger, CVAT_EXPORT_FORMAT, jobs)

        rows: list[dict] = []
        for job in jobs:
            rows.extend(
                self._annotation_rows(
                    job_annotations[job.cvat_id], assignments_by_clip, attr_names
                )
            )
        rows.sort(key=lambda r: (r["filename"], r["_start_s"]))
        merged = self._render_tsv([*_LEADING_COLUMNS, *attr_names], rows)

        self.logger.debug(f"Uploading merged annotations for the escrow ({self.escrow_address=})")
        upload_escrow_results(
            files=[
                FileDescriptor(
                    filename=TaskResultsLayout.ANNOTATIONS_FILENAME, file=io.BytesIO(merged)
                ),
                prepare_annotation_metafile(jobs=jobs),
            ],
            chain_id=self.chain_id,
            escrow_address=self.escrow_address,
        )

        self._emit_escrow_recorded()
        self.logger.info(f"The escrow ({self.escrow_address=}) is completed, annotations merged")

    def _load_assignments(self) -> dict[str, Assignment]:
        storage_client = make_cloud_client(BucketAccessInfo.parse_obj(Config.storage_config))
        assignments = TaskMetaSerializer().parse_assignments(
            storage_client.download_file(
                compose_data_bucket_filename(
                    self.escrow_address, self.chain_id, TaskMetaLayout().ASSIGNMENTS_FILENAME
                )
            )
        )
        return {a.clip_filename: a for a in assignments}

    def _annotation_rows(
        self,
        annotations: FileDescriptor,
        assignments_by_clip: dict[str, Assignment],
        attr_names: list[str],
    ) -> list[dict]:
        annotations.file.seek(0)
        text_stream = io.TextIOWrapper(annotations.file, encoding="utf-8")
        reader = csv.DictReader(text_stream, delimiter="\t")

        rows: list[dict] = []
        for interval in reader:
            clip = interval["filename"].rsplit("/", 1)[-1]
            assignment = assignments_by_clip.get(clip)
            if assignment is None:
                raise AssertionError(f"No assignment found for clip '{clip}'")

            start_s = parse_time(interval["start"]).total_seconds()
            stop_s = parse_time(interval["stop"]).total_seconds()

            placed = self._placed_at(assignment, start_s)
            if placed is None or placed.kind.value == "gt":
                # outside any region, or a honeypot -> dropped
                continue

            offset = placed.file_start - placed.clip_start
            rows.append(
                {
                    "filename": placed.source_filename,
                    "start": format_time(timedelta(seconds=start_s + offset)),
                    "stop": format_time(timedelta(seconds=stop_s + offset)),
                    "_start_s": start_s + offset,
                    "label": interval.get("label", ""),
                    "input_region_ids": ",".join(i.split(":")[-1] for i in placed.input_ids),
                    **{attr: interval.get(attr, "") or "" for attr in attr_names},
                }
            )
        return rows

    @staticmethod
    def _placed_at(assignment: Assignment, clip_time_s: float) -> PlacedRegion | None:
        return next(
            (
                p
                for p in assignment.placed
                if p.clip_start <= clip_time_s < p.clip_stop
            ),
            None,
        )

    @staticmethod
    def _render_tsv(columns: list[str], rows: list[dict]) -> bytes:
        buffer = io.StringIO()
        writer = csv.DictWriter(
            buffer, fieldnames=columns, delimiter="\t", extrasaction="ignore"
        )
        writer.writeheader()
        for global_id, row in enumerate(rows):
            writer.writerow({**row, "id": global_id})
        return buffer.getvalue().encode("utf-8")
