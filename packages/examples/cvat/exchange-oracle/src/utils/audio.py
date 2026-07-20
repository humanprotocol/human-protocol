"""ffmpeg/ffprobe helpers for audio task creation.

ffmpeg and ffprobe must be available on PATH (system dependency).
Ported from the asr-qa-research prototype (experiments/pipeline_test/oracle.py::cut_clip).
"""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from datetime import timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pathlib import Path


class FfmpegError(RuntimeError):
    pass


@dataclass(frozen=True)
class RegionCut:
    """A slice [start, stop) to take from a source media file."""

    media: Path
    start: timedelta
    stop: timedelta

    @property
    def duration(self) -> timedelta:
        return self.stop - self.start


def probe_duration(path: Path) -> timedelta:
    """Return media duration in seconds"""

    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "csv=p=0",
        str(path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)  # noqa: S603
    if result.returncode != 0:
        raise FfmpegError(f"ffprobe failed for {path}:\n{result.stderr[-800:]}")

    return timedelta(seconds=float(result.stdout.strip()))


def cut_and_concat(
    regions: list[RegionCut],
    out_path: Path,
    *,
    pause_ms: int,
    sample_rate: int,
) -> None:
    """
    Trim each region from its own media and concatenate them into a single mono clip,
    separated by ``pause_ms`` of silence. Output is ``sample_rate`` Hz mono WAV.

    Assignments mix regions from multiple source files, so each region is trimmed from its
    own input (distinct medias map to distinct ffmpeg input indices).
    """
    if not regions:
        raise ValueError("cut_and_concat requires at least one region")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    pause_s = pause_ms / 1000.0

    # distinct source files -> ffmpeg input indices
    medias: list[Path] = []
    idx_of: dict[str, int] = {}
    for region in regions:
        key = str(region.media)
        if key not in idx_of:
            idx_of[key] = len(medias)
            medias.append(region.media)

    filter_parts: list[str] = []
    segment_labels: list[str] = []
    n = len(regions)
    for i, region in enumerate(regions):
        inp = idx_of[str(region.media)]
        filter_parts.append(
            f"[{inp}:a]atrim={region.start.total_seconds():.3f}:{region.stop.total_seconds():.3f},"
            "asetpts=PTS-STARTPTS,"
            f"aresample={sample_rate},aformat=channel_layouts=mono[s{i}]"
        )
        segment_labels.append(f"[s{i}]")
        if i < n - 1:
            filter_parts.append(f"aevalsrc=0:d={pause_s}:s={sample_rate}[g{i}]")
            segment_labels.append(f"[g{i}]")

    filter_parts.append("".join(segment_labels) + f"concat=n={len(segment_labels)}:v=0:a=1[out]")

    inputs: list[str] = []
    for media in medias:
        inputs += ["-i", str(media)]

    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-v",
        "error",
        *inputs,
        "-filter_complex",
        ";".join(filter_parts),
        "-map",
        "[out]",
        "-ar",
        str(sample_rate),
        "-ac",
        "1",
        str(out_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)  # noqa: S603
    if result.returncode != 0:
        raise FfmpegError(f"ffmpeg cut/concat failed for {out_path}:\n{result.stderr[-800:]}")
