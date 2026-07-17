from __future__ import annotations

import csv
import io
from typing import TYPE_CHECKING

from audio_qe import (
    Granularity,
    GroupingConfig,
    GroupingStrategy,
    Interval,
    Metric,
    Normalizer,
    NormalizerConfig,
    NormalizerMode,
    TranscriptionRequirement,
    lang_preset,
    match_transcriptions,
)
from audio_qe.data import AlignMode
from audio_qe.transcription_matching import aggregate_metric, tokenize

from src.core.config import Config
from src.core.manifest.v2 import TargetMetrics
from src.core.storage import compose_data_bucket_filename, compose_results_bucket_filename
from src.core.tasks.audio_transcription.meta import (
    InputGtRegion,
    RegionKind,
    TaskMetaLayout,
    TaskMetaSerializer,
    TaskResultsLayout,
    parse_gt_tsv,
    parse_time,
)
from src.core.tasks.audio_transcription.spec import NormalizerPreset, parse_audio_manifest
from src.core.validation_errors import LowQualityError, TooFewGtError
from src.handlers.validation.common import UNKNOWN_QUALITY
from src.handlers.validation.quality_checkers.base import TaskQualityChecker
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo

if TYPE_CHECKING:
    from src.core.annotation_meta import JobMeta
    from src.core.tasks.audio_transcription.meta import Clip, PlacedRegion
    from src.services.cloud.client import StorageClient

# Groups are keyed by the presented honeypot so each honeypot's transcription is aligned in
# isolation (no cross-honeypot / cross-file overlap).
_GROUP_ATTR = "honeypot_id"


class AudioTaskQualityChecker(TaskQualityChecker):
    """
    Scores audio-transcription assignments. CVAT doesn't support quality computation for such tasks
    yet, so the computations are performed in the oracle.

    Each assignment annotations are scored per their honeypots, computing the WER/CER metrics.

    Honeypot rotation is not used.
    """

    ALLOWED_METRICS = (TargetMetrics.wer, TargetMetrics.cer)

    _METRIC_PARAMS = {
        TargetMetrics.wer: {
            "granularity": Granularity.WORD,
            "align": AlignMode.WORD,
            "metric": Metric.EQUALITY,
        },
        TargetMetrics.cer: {
            "granularity": Granularity.CHARACTER,
            "align": AlignMode.CHAR,
            "metric": Metric.EQUALITY,
        },
    }

    def _validate_jobs(self) -> None:
        spec = parse_audio_manifest(self.manifest)

        metric = spec.validation.target_metric
        if metric not in self.ALLOWED_METRICS:
            raise NotImplementedError(
                "Audio transcription validation only supports {} metrics, got '{}'".format(
                    ", ".join(v.value for v in self.ALLOWED_METRICS), metric.value
                )
            )

        target = spec.validation.target_score
        transcription_attr = spec.details.transcription_attr_name

        req = TranscriptionRequirement(
            **self._METRIC_PARAMS[metric],
            text_attribute=transcription_attr,
            normalizer=self._normalizer_config(spec.details.normalizer),
            grouping=GroupingConfig(attribute=_GROUP_ATTR, strategy=GroupingStrategy.JOIN),
            overlap_tolerance_ms=round(spec.details.boundary_tolerance.total_seconds() * 1000),
        )
        normalizer = Normalizer(req.normalizer)

        client = make_cloud_client(
            BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config)
        )
        gt_annotations = self._load_gt(client)
        clips_by_id = self._load_clips_meta(client)
        task_clips = self._load_task_clips(client)
        annotation_bytes = self._download_assignment_annotations(client)

        job_results: dict[int, float] = {}
        rejected_jobs: dict[int, object] = {}

        for job_meta in self._meta.jobs:
            ds_annotations = self._parse_annotations(annotation_bytes[job_meta.job_id])
            # Each CVAT task holds exactly one clip; join the job to its clip via the EO-recorded
            # task -> clip mapping. An empty submission still resolves here, so its honeypots score
            # as full deletions (rate 1.0) instead of being treated as unverifiable.
            clip_meta = clips_by_id[task_clips[job_meta.task_id]]

            gt_intervals, hyp_intervals = self._build_intervals(
                ds_annotations,
                gt_annotations,
                clip_meta=clip_meta,
                transcription_attr=transcription_attr,
            )
            if not gt_intervals:
                # No honeypots available - not expected by construction.
                job_results[job_meta.job_id] = UNKNOWN_QUALITY
                rejected_jobs[job_meta.job_id] = TooFewGtError()
                continue

            report = match_transcriptions(gt_intervals, hyp_intervals, req=req)
            rate = self._job_error_rate(report, req, normalizer)
            job_results[job_meta.job_id] = rate

            # WER/CER are lower-is-better; reject when the error rate exceeds the target.
            if rate > target:
                rejected_jobs[job_meta.job_id] = LowQualityError()

        self._job_results = job_results
        self._rejected_jobs = rejected_jobs

        # No honeypot rotation for audio: empty gt_stats skips the rotation branch in
        # process_intermediate_results; the layout maps are unused but must be set for validate().
        self._gt_stats = {}
        self._task_id_to_val_layout = {}
        self._task_id_to_honeypots_mapping = {}
        self._task_id_to_sequence_of_frame_names = {}
        self._task_id_to_labels = {}

    @staticmethod
    def _normalizer_config(preset: NormalizerPreset | None) -> NormalizerConfig:
        # Absent normalizer = passthrough; basic = built-in mode; a language code resolves to its
        # preset (BASIC plus per-language rules).
        if preset is None:
            return NormalizerConfig(mode=NormalizerMode.NONE)
        if preset == NormalizerPreset.basic:
            return NormalizerConfig(mode=NormalizerMode.BASIC)
        return lang_preset(preset.value)

    def _load_gt(self, client: StorageClient) -> dict[str, InputGtRegion]:
        data = client.download_file(
            compose_data_bucket_filename(
                self.escrow_address, self.chain_id, TaskMetaLayout.GT_FILENAME
            )
        )
        return {region.id: region for region in parse_gt_tsv(data)}

    def _load_clips_meta(self, client: StorageClient) -> dict[str, Clip]:
        "Returns clip id -> clip meta mapping."

        data = client.download_file(
            compose_data_bucket_filename(
                self.escrow_address, self.chain_id, TaskMetaLayout.CLIPS_FILENAME
            )
        )
        return {a.id: a for a in TaskMetaSerializer().parse_clips(data)}

    def _load_task_clips(self, client: StorageClient) -> dict[int, str]:
        "Returns CVAT task id -> clip id mapping."

        data = client.download_file(
            compose_data_bucket_filename(
                self.escrow_address, self.chain_id, TaskMetaLayout.TASK_CLIPS_FILENAME
            )
        )
        return TaskMetaSerializer().parse_task_clips(data)

    @staticmethod
    def _parse_annotations(annotation: bytes) -> list[dict]:
        return list(csv.DictReader(io.StringIO(annotation.decode("utf-8")), delimiter="\t"))

    def _build_intervals(
        self,
        ds_annotations: list[dict],
        gt_annotations: dict[str, InputGtRegion],
        *,
        clip_meta: Clip,
        transcription_attr: str,
    ) -> tuple[list[Interval], list[Interval]]:
        gt_placements = [p for p in clip_meta.placed if p.kind == RegionKind.gt]

        # Ground-truth reference intervals for every presented honeypot (built regardless of what
        # the annotator produced, so an omitted honeypot becomes a missing group = full errors).
        gt_intervals: list[Interval] = []
        counter = 0
        for placed in gt_placements:
            honeypot_id = self._honeypot_id(placed)
            for region_id in placed.input_ids:
                try:
                    gt = gt_annotations[region_id]
                except KeyError as e:
                    raise AssertionError(
                        f"Honeypot region '{region_id}' is missing from gt.tsv"
                    ) from e

                gt_intervals.append(
                    Interval(
                        id=counter,
                        start=gt.start.total_seconds() * 1000.0,
                        stop=gt.stop.total_seconds() * 1000.0,
                        label=gt.label,
                        extra={transcription_attr: gt.text, _GROUP_ATTR: honeypot_id},
                    )
                )
                counter += 1

        # Annotator (hypothesis) intervals: only rows falling inside a honeypot window, mapped from
        # clip-time back to source-file time.
        hyp_intervals: list[Interval] = []
        for row in ds_annotations:
            start_s = parse_time(row["start"]).total_seconds()
            stop_s = parse_time(row["stop"]).total_seconds()
            placed = self._honeypot_at(clip_meta, start_s, stop_s)
            if placed is None:
                continue
            offset = placed.source_start - placed.clip_start
            hyp_intervals.append(
                Interval(
                    id=counter,
                    start=(start_s + offset) * 1000.0,
                    stop=(stop_s + offset) * 1000.0,
                    label=row["label"],
                    extra={
                        transcription_attr: row[transcription_attr],
                        _GROUP_ATTR: self._honeypot_id(placed),
                    },
                )
            )
            counter += 1

        return gt_intervals, hyp_intervals

    def _download_assignment_annotations(self, client: StorageClient) -> dict[int, bytes]:
        "Download every job's per-assignment annotation TSV up front, keyed by cvat job id."
        return {
            job_meta.job_id: self._download_assignment_tsv(client, job_meta)
            for job_meta in self._meta.jobs
        }

    def _download_assignment_tsv(self, client: StorageClient, job_meta: JobMeta) -> bytes:
        return client.download_file(
            compose_results_bucket_filename(
                self.escrow_address,
                self.chain_id,
                TaskResultsLayout.assignment_annotation_filename(
                    job_meta.job_id, job_meta.assignment_id
                ),
            )
        )

    @staticmethod
    def _honeypot_id(placed: PlacedRegion) -> str:
        # A gt placement is always built from >=1 GT input ROI, so input_ids is non-empty.
        assert placed.input_ids, f"honeypot placement has no input regions: {placed}"
        return ",".join(placed.input_ids)

    @staticmethod
    def _honeypot_at(clip: Clip, start_s: float, stop_s: float) -> PlacedRegion | None:
        """
        Return the honeypot placement that fully contains the annotator interval ``[start_s,
        stop_s]`` within its inclusion window.

        Each honeypot window is extended by half of the join pause to the adjacent region on each
        side (``[hp_start - pause/2, hp_stop + pause/2]``); an interval counts for the honeypot only
        if both its endpoints fall inside. Annotator segment boundaries don't align with the
        synthetic cut/pause boundaries: the half-pause margin keeps a segment that drifts into the
        surrounding pause, while requiring both endpoints inside excludes one that spills into an
        adjacent region.
        """
        regions = sorted(clip.placed, key=lambda p: p.clip_start)
        for idx, p in enumerate(regions):
            if p.kind != RegionKind.gt:
                continue
            lo = p.clip_start
            hi = p.clip_stop
            if idx > 0:
                lo -= (p.clip_start - regions[idx - 1].clip_stop) / 2
            if idx < len(regions) - 1:
                hi += (regions[idx + 1].clip_start - p.clip_stop) / 2
            if lo <= start_s and stop_s <= hi:
                return p
        return None

    def _job_error_rate(self, report, req: TranscriptionRequirement, normalizer) -> float:
        """
        Micro-averaged error rate over the assignment's honeypots. The library's ``corpus_rate``
        only aggregates matched groups, so missing groups (honeypot the annotator left empty) are
        added as full deletions and extra groups as insertions (mirrors the CVAT accumulation).
        """
        total_err = 0.0
        total_ref = 0

        matched_ref = sum(len(a.ref_units) for a in report.alignments)
        if matched_ref:
            _, matched_rate = aggregate_metric(
                report.alignments,
                metric=req.metric,
                threshold=req.threshold,
                granularity=req.granularity,
            )
            total_err += matched_rate * matched_ref
            total_ref += matched_ref

        for _key, gt_group in report.missing_groups:
            units = self._group_units(gt_group, req, normalizer)
            total_err += len(units)
            total_ref += len(units)

        for _key, ds_group in report.extra_groups:
            total_err += len(self._group_units(ds_group, req, normalizer))

        return total_err / total_ref if total_ref else 0.0

    @staticmethod
    def _group_units(group: list[Interval], req: TranscriptionRequirement, normalizer) -> list[str]:
        joined = req.grouping.join_separator.join(
            iv.extra[req.text_attribute] for iv in sorted(group, key=lambda i: i.start)
        )
        return tokenize(normalizer(joined), granularity=req.granularity)
