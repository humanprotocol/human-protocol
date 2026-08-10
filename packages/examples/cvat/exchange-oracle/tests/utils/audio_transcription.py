from __future__ import annotations

import math
from typing import TYPE_CHECKING

from src.core.tasks.audio_transcription.meta import (
    RegionKind,
    parse_gt_tsv,
)

if TYPE_CHECKING:
    from src.core.tasks.audio_transcription.meta import Clip, InputGtRegion

# Canonical audio task input, shared by the task-creation and validation tests so both exercise
# the same layout. DS_ROIS: per-file region start times (each ROI is DS_LEN seconds long).
DS_LEN = 10.0
DS_ROIS = {
    "audio1.wav": [30.0, 45.0, 60.0, 75.0],
    "audio2.wav": [30.0, 45.0, 60.0],
    "audio3.wav": [10.0, 25.0, 40.0, 55.0],
    "audio4.wav": [10.0, 25.0, 40.0],
    "audio5.wav": [10.0, 25.0],
}
# (span_id, filename, [(start, stop), ...]) -- 3 GT spans with 1, 2 and 3 cues. Each span covers
# >= min_gt_span_duration and sits after its recording's DS regions, so GT and DS stay disjoint.
GT_ROIS = [
    ("s1", "audio1.wav", [(90.0, 112.0)]),
    ("s2", "audio2.wav", [(90.0, 98.0), (106.0, 112.0)]),
    ("s3", "audio3.wav", [(80.0, 86.0), (92.0, 98.0), (104.0, 110.0)]),
]
TRANSCRIPTION_ATTR = "transcription"

# Media, regions and GT share one layout: the recordings must contain every DS/GT cue, so the
# file set and duration are derived from DS_ROIS/GT_ROIS rather than pinned independently.
MEDIA_MARGIN_S = 8.0


def _region_stops() -> list[float]:
    ds_stops = [start + DS_LEN for starts in DS_ROIS.values() for start in starts]
    gt_stops = [stop for _span_id, _filename, regions in GT_ROIS for _start, stop in regions]
    return ds_stops + gt_stops


MEDIA_FILES = sorted({*DS_ROIS, *(filename for _span_id, filename, _regions in GT_ROIS)})
MEDIA_DURATION_S = math.ceil(max(_region_stops()) + MEDIA_MARGIN_S)


def ts(seconds: float) -> str:
    """Render seconds as an ``H:MM:SS.ffffff`` timestamp (the region/GT/annotation TSV format)."""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds - h * 3600 - m * 60
    return f"{h}:{m:02d}:{s:09.6f}"


def build_regions_tsv(ds_rois: dict[str, list[float]] = DS_ROIS, ds_len: float = DS_LEN) -> str:
    return "filename\tstart\tstop\tlabel\n" + "".join(
        f"{filename}\t{ts(start)}\t{ts(start + ds_len)}\tspeech\n"
        for filename, starts in ds_rois.items()
        for start in starts
    )


def build_gt_tsv(gt_rois: list = GT_ROIS) -> str:
    return "filename\tstart\tstop\tlabel\ttext\tspan_id\n" + "".join(
        f"{filename}\t{ts(start)}\t{ts(stop)}\tspeech\tgt {span_id} {roi_idx} text\t{span_id}\n"
        for roi_idx, (span_id, filename, regions) in enumerate(gt_rois)
        for start, stop in regions
    )


def gt_regions_by_id(gt_tsv: str) -> dict[str, InputGtRegion]:
    return {region.id: region for region in parse_gt_tsv(gt_tsv.encode())}


def build_perfect_annotation(
    clip: Clip,
    gt: dict[str, InputGtRegion],
    *,
    transcription_attr: str = TRANSCRIPTION_ATTR,
) -> str:
    """Produce an annotator submission TSV that perfectly transcribes every honeypot in ``clip``.

    Each GT cue's source-time window is mapped back to clip time via its placement offset and
    emitted with the GT text, so validation aligns it exactly (WER/CER == 0).
    """
    rows: list[tuple[float, float, str]] = []
    for placed in clip.placed:
        if placed.kind != RegionKind.gt:
            continue
        offset = placed.source_start - placed.clip_start  # clip_time = source_time - offset
        for region_id in placed.input_ids:
            cue = gt[region_id]
            rows.append(
                (cue.start.total_seconds() - offset, cue.stop.total_seconds() - offset, cue.text)
            )
    rows.sort()
    body = "".join(f"{ts(start)}\t{ts(stop)}\tspeech\t{text}\n" for start, stop, text in rows)
    return build_empty_annotation(transcription_attr) + body


def build_empty_annotation(transcription_attr: str = TRANSCRIPTION_ATTR) -> str:
    """An annotator submission with no transcribed intervals.

    Every presented honeypot is then unmatched, so validation scores each as a full deletion
    (error rate 1.0) -- i.e. a failing assignment.
    """
    return f"start\tstop\tlabel\t{transcription_attr}\n"
