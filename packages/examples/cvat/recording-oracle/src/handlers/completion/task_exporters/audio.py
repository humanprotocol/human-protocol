from __future__ import annotations

import csv
import io
import zipfile

from src.core.tasks.audio_transcription.meta import (
    TaskMetaLayout,
    TaskResultsLayout,
    format_time,
    parse_gt_tsv,
    parse_time,
)
from src.core.tasks.audio_transcription.spec import parse_audio_manifest
from src.handlers.completion.task_exporters.base import TaskExporter

# Column marking each merged row's origin: annotator annotation vs ground truth.
_SOURCE_COLUMN = "source"
_ANNOTATION_SOURCE = "annotation"
_GT_SOURCE = "gt"


class AudioTaskExporter(TaskExporter):
    def export(self) -> bytes:
        tsv = self._build_merged_tsv()

        archive = io.BytesIO()
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(TaskResultsLayout.ANNOTATIONS_FILENAME, tsv)

        return archive.getvalue()

    def _build_merged_tsv(self) -> bytes:
        spec = parse_audio_manifest(self.manifest)
        attr = spec.details.transcription_attr_name

        annotations = self._download_annotation_result_file(
            TaskResultsLayout.ANNOTATIONS_FILENAME
        ).decode("utf-8")
        reader = csv.DictReader(io.StringIO(annotations), delimiter="\t")
        columns = list(reader.fieldnames or [])
        if _SOURCE_COLUMN not in columns:
            # place it right after "label" when possible, otherwise append
            insert_at = columns.index("label") + 1 if "label" in columns else len(columns)
            columns.insert(insert_at, _SOURCE_COLUMN)

        ds_rows = list(reader)
        for row in ds_rows:
            row[_SOURCE_COLUMN] = _ANNOTATION_SOURCE

        gt_regions = parse_gt_tsv(self._download_task_data_file(TaskMetaLayout.GT_FILENAME))
        gt_rows = [
            {
                "filename": r.filename,
                "start": format_time(r.start),
                "stop": format_time(r.stop),
                "label": r.label or "",
                "input_region_ids": str(r.row_idx),
                _SOURCE_COLUMN: _GT_SOURCE,
                attr: r.text,
            }
            for r in gt_regions
        ]

        rows = ds_rows + gt_rows
        rows.sort(key=lambda r: (r["filename"], parse_time(r["start"]).total_seconds()))

        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=columns, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        for global_id, row in enumerate(rows):
            writer.writerow({**dict.fromkeys(columns, ""), **row, "id": global_id})
        return buffer.getvalue().encode("utf-8")
