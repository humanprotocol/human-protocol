"""Domain types and meta persistence for audio transcription tasks.

Regions are mixed across input files into assignments, so every region carries its own source
provenance. The persisted mappings (regions + assignments) let each region be located back in its
source media after mixing.
"""

from __future__ import annotations

from enum import Enum
from typing import TYPE_CHECKING

from attrs import Factory, frozen
from datumaro.util import dump_json, parse_json

from src.utils.enums import BetterEnumMeta

if TYPE_CHECKING:
    from datetime import timedelta


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
    label: str | None = None
    text: str = ""
    row_idx: int

    @property
    def id(self) -> str:
        return f"{self.filename}:{self.row_idx}"


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
    file_start: float
    file_stop: float
    clip_start: float
    clip_stop: float
    kind: RegionKind = RegionKind.ds
    input_ids: list[str] = Factory(list)  # ids of the input ROIs this bundle was built from


@frozen(kw_only=True)
class Assignment:
    """One CVAT task: a single concatenated clip built from ``placed`` regions."""

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
        "file_start": r.file_start,
        "file_stop": r.file_stop,
        "clip_start": r.clip_start,
        "clip_stop": r.clip_stop,
        "kind": r.kind.value,
        "input_ids": list(r.input_ids),
    }


def _placed_from_dict(d: dict) -> PlacedRegion:
    return PlacedRegion(
        index=d["index"],
        source_filename=d["source_filename"],
        file_start=d["file_start"],
        file_stop=d["file_stop"],
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
    ASSIGNMENTS_FILENAME = "assignments.json"
    DS_CUTS_DIR = "ds_cuts"
    GT_CUTS_DIR = "gt_cuts"


class TaskMetaSerializer:
    def serialize_regions(self, regions: list[PresentedRegion]) -> bytes:
        return dump_json([_region_to_dict(r) for r in regions])

    def parse_regions(self, data: bytes) -> list[PresentedRegion]:
        return [_region_from_dict(d) for d in parse_json(data)]

    def serialize_assignments(self, assignments: list[Assignment]) -> bytes:
        return dump_json(
            [
                {
                    "id": a.id,
                    "clip_filename": a.clip_filename,
                    "clip_dur": a.clip_duration,
                    "placed": [_placed_to_dict(p) for p in a.placed],
                }
                for a in assignments
            ]
        )

    def parse_assignments(self, data: bytes) -> list[Assignment]:
        return [
            Assignment(
                id=d["id"],
                clip_filename=d["clip_filename"],
                clip_duration=d["clip_dur"],
                placed=[_placed_from_dict(p) for p in d.get("placed", [])],
            )
            for d in parse_json(data)
        ]
