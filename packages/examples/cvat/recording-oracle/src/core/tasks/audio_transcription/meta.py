"""Domain types and meta persistence for audio transcription tasks.

Regions are mixed across input files into assignments, so every region carries its own source
provenance. The persisted mappings (regions + assignments) let each region be located back in its
source media after mixing.
"""

from __future__ import annotations

import csv
import io
import time
from datetime import timedelta
from enum import Enum

from attrs import Factory, frozen
from datumaro.util import dump_json, parse_json

from src.utils.enums import BetterEnumMeta

CVAT_EXPORT_FORMAT = "Generic TSV 1.0"


def parse_time(value: str) -> timedelta:
    """Parse an ``H:MM:SS(.ffffff)`` timestamp (as used in the region/GT TSVs)."""
    for fmt_string in ("%H:%M:%S.%f", "%H:%M:%S"):
        try:
            parsed_time = time.strptime(value, fmt_string)
            if fmt_string.endswith(".%f"):
                # time.strptime drops sub-second precision, so recover it from the raw string.
                frac = value.split(".", maxsplit=1)[-1]
                microseconds = int(frac.ljust(6, "0")[:6])
            else:
                microseconds = 0
        except ValueError:
            continue
        else:
            return timedelta(
                hours=parsed_time.tm_hour,
                minutes=parsed_time.tm_min,
                seconds=parsed_time.tm_sec,
                microseconds=microseconds,
            )

    raise ValueError(f"Failed to parse timestamp '{value}'")


def format_time(value: timedelta) -> str:
    """Render a timedelta as an ``H:MM:SS.ffffff`` timestamp."""
    total = value.total_seconds()
    h = int(total // 3600)
    m = int((total % 3600) // 60)
    s = total - h * 3600 - m * 60
    return f"{h}:{m:02d}:{s:09.6f}"


@frozen(kw_only=True)
class InputRegion:
    """A region to annotate, parsed from the input regions TSV."""

    filename: str
    start: timedelta
    stop: timedelta
    label: str | None = None
    row_idx: int

    @property
    def id(self) -> str:
        return f"{self.filename}:{self.row_idx}"


@frozen(kw_only=True)
class InputGtRegion:
    """A ground-truth region, parsed from the input GT TSV."""

    filename: str
    start: timedelta
    stop: timedelta
    label: str
    text: str
    row_idx: int
    span_id: str

    @property
    def id(self) -> str:
        return f"{self.filename}:{self.row_idx}"


def parse_gt_tsv(data: bytes) -> list[InputGtRegion]:
    reader = csv.DictReader(io.StringIO(data.decode("utf-8")), delimiter="\t")
    return [
        InputGtRegion(
            filename=row["filename"].strip(),
            row_idx=row_idx,
            start=parse_time(row["start"]),
            stop=parse_time(row["stop"]),
            label=row["label"].strip(),
            text=row["text"].strip(),
            span_id=row["span_id"].strip(),
        )
        for row_idx, row in enumerate(reader)
    ]


class RegionKind(str, Enum, metaclass=BetterEnumMeta):
    gt = "gt"  # ground-truth honeypot region
    ds = "ds"  # regular dataset region to annotate


@frozen(kw_only=True)
class PresentedRegion:
    "A bundle of consecutive input ROIs from one source file, presented as a single region."

    source_filename: str
    start: float  # bundle span (file-time seconds): first ROI start .. last ROI stop
    stop: float
    kind: RegionKind
    input_ids: list[str] = Factory(list)

    @property
    def duration(self) -> float:
        return self.stop - self.start


@frozen(kw_only=True)
class PlacedRegion:
    "A presented region placed in an assignment"

    index: int  # 0-based position within the assignment clip
    source_filename: str
    source_start: float
    source_stop: float
    clip_start: float
    clip_stop: float
    kind: RegionKind
    input_ids: list[str] = Factory(list)  # ids of the input ROIs this bundle was built from


@frozen(kw_only=True)
class Clip:
    """A single concatenated audio clip built from ``placed`` regions (one per CVAT task)."""

    id: str
    clip_filename: str
    clip_duration: float
    placed: list[PlacedRegion] = Factory(list)


def _region_to_dict(r: PresentedRegion) -> dict:
    return {
        "source_filename": r.source_filename,
        "start": r.start,
        "stop": r.stop,
        "kind": r.kind.value,
        "input_ids": list(r.input_ids),
    }


def _region_from_dict(d: dict) -> PresentedRegion:
    return PresentedRegion(
        source_filename=d["source_filename"],
        start=d["start"],
        stop=d["stop"],
        kind=RegionKind(d["kind"]),
        input_ids=list(d.get("input_ids", [])),
    )


def _placed_to_dict(r: PlacedRegion) -> dict:
    return {
        "index": r.index,
        "source_filename": r.source_filename,
        "source_start": r.source_start,
        "source_stop": r.source_stop,
        "clip_start": r.clip_start,
        "clip_stop": r.clip_stop,
        "kind": r.kind.value,
        "input_ids": list(r.input_ids),
    }


def _placed_from_dict(d: dict) -> PlacedRegion:
    return PlacedRegion(
        index=d["index"],
        source_filename=d["source_filename"],
        source_start=d["source_start"],
        source_stop=d["source_stop"],
        clip_start=d["clip_start"],
        clip_stop=d["clip_stop"],
        kind=RegionKind(d["kind"]),
        input_ids=list(d.get("input_ids", [])),
    )


class TaskMetaLayout:
    CLIPS_DIR = "clips"  # assignment clips subdir on the oracle bucket
    GT_FILENAME = "gt.tsv"
    REGIONS_TSV_FILENAME = "regions.tsv"
    REGIONS_FILENAME = "regions.json"
    CLIPS_FILENAME = "assignments.json"
    TASK_CLIPS_FILENAME = "task_clips.json"
    DS_CUTS_DIR = "ds_cuts"
    GT_CUTS_DIR = "gt_cuts"


class TaskResultsLayout:
    "Layout of the escrow results dir on the oracle bucket."

    ASSIGNMENTS_DIR = "assignments"  # per-assignment annotation TSVs (one per CVAT job)
    ANNOTATIONS_FILENAME = "annotations.tsv"  # merged annotations (without honeypots or GT)

    @classmethod
    def assignment_annotation_filename(cls, job_id: int, assignment_id: str) -> str:
        "Path (relative to the results dir) of a job's per-assignment annotation TSV."
        return f"{cls.ASSIGNMENTS_DIR}/{job_id}-{assignment_id}.tsv"


class TaskMetaSerializer:
    def serialize_regions(self, regions: list[PresentedRegion]) -> bytes:
        return dump_json([_region_to_dict(r) for r in regions])

    def parse_regions(self, data: bytes) -> list[PresentedRegion]:
        return [_region_from_dict(d) for d in parse_json(data)]

    def serialize_clips(self, clips: list[Clip]) -> bytes:
        return dump_json(
            [
                {
                    "id": clip.id,
                    "clip_filename": clip.clip_filename,
                    "clip_dur": clip.clip_duration,
                    "placed": [_placed_to_dict(p) for p in clip.placed],
                }
                for clip in clips
            ]
        )

    def parse_clips(self, data: bytes) -> list[Clip]:
        return [
            Clip(
                id=d["id"],
                clip_filename=d["clip_filename"],
                clip_duration=d["clip_dur"],
                placed=[_placed_from_dict(p) for p in d.get("placed", [])],
            )
            for d in parse_json(data)
        ]

    def serialize_task_clips(self, task_clips: dict[int, str]) -> bytes:
        return dump_json({str(task_id): clip_id for task_id, clip_id in task_clips.items()})

    def parse_task_clips(self, data: bytes) -> dict[int, str]:
        return {int(task_id): clip_id for task_id, clip_id in parse_json(data).items()}
