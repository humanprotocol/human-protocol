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
    from src.core.tasks.audio_transcription.meta import Assignment, PlacedRegion
    from src.services.cloud.client import StorageClient

# Groups are keyed by the presented honeypot so each honeypot's transcription is aligned in
# isolation (no cross-honeypot / cross-file overlap).
_GROUP_ATTR = "honeypot_id"


class AudioTaskQualityChecker(TaskQualityChecker):
    """
    Scores audio-transcription assignments. CVAT doesn't support quality computation for such tasks
    yet, so the computations are performed in the oracle.

    For each job it reconstructs the annotator's honeypot transcriptions (from the per-assignment
    TSV + the assignment/clip mapping), aligns them against the ground truth per presented honeypot,
    and computes the WER/CER error rate.

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
        }
    }

    def _validate_jobs(self) -> None:
        spec = parse_audio_manifest(self.manifest)

        metric = spec.validation.target_metric
        if metric not in self.ALLOWED_METRICS:
            raise NotImplementedError(
                "Audio transcription validation only supports {} metrics, got '{}'".format(
                    ', '.join(v.value for v in self.ALLOWED_METRICS),
                    metric.value
                )
            )

        target = spec.validation.target_score
        transcription_attr = spec.details.transcription_attr_name

        req = TranscriptionRequirement(
            **self._METRIC_PARAMS[metric],
            text_attribute=transcription_attr,
            normalizer=self._normalizer_config(spec.details.normalizer),
            grouping=GroupingConfig(attribute=_GROUP_ATTR, strategy=GroupingStrategy.JOIN),
        )
        normalizer = Normalizer(req.normalizer)

        client = make_cloud_client(
            BucketAccessInfo.parse_obj(Config.exchange_oracle_storage_config)
        )
        gt_rows = self._load_gt(client)
        assignments = self._load_assignments(client)
        annotations = self._download_assignment_tsvs(client)

        job_results: dict[int, float] = {}
        rejected_jobs: dict[int, object] = {}

        for job_meta in self._meta.jobs:
            gt_intervals, hyp_intervals = self._build_intervals(
                annotations[job_meta.job_id], assignments, gt_rows, transcription_attr
            )
            if not gt_intervals:
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

    def _load_assignments(self, client: StorageClient) -> dict[str, Assignment]:
        data = client.download_file(
            compose_data_bucket_filename(
                self.escrow_address, self.chain_id, TaskMetaLayout.ASSIGNMENTS_FILENAME
            )
        )
        return {a.clip_filename: a for a in TaskMetaSerializer().parse_assignments(data)}

    def _build_intervals(
        self,
        annotation: bytes,
        assignments: dict[str, Assignment],
        gt_rows: dict[str, InputGtRegion],
        attr: str,
    ) -> tuple[list[Interval], list[Interval]]:
        rows = list(csv.DictReader(io.StringIO(annotation.decode("utf-8")), delimiter="\t"))

        assignment = self._resolve_assignment(rows, assignments)
        if assignment is None:
            return [], []

        gt_placements = [p for p in assignment.placed if p.kind == RegionKind.gt]

        # Ground-truth reference intervals for every presented honeypot (built regardless of what
        # the annotator produced, so an omitted honeypot becomes a missing group = full errors).
        gt_intervals: list[Interval] = []
        counter = 0
        for placed in gt_placements:
            honeypot_id = self._honeypot_id(placed)
            for region_id in placed.input_ids:
                gt = gt_rows.get(region_id)
                if gt is None:
                    continue
                gt_intervals.append(
                    Interval(
                        id=counter,
                        start=gt.start.total_seconds() * 1000.0,
                        stop=gt.stop.total_seconds() * 1000.0,
                        label=gt.label or "",
                        extra={attr: gt.text, _GROUP_ATTR: honeypot_id},
                    )
                )
                counter += 1

        # Annotator (hypothesis) intervals: only rows falling inside a honeypot window, mapped from
        # clip-time back to source-file time.
        hyp_intervals: list[Interval] = []
        for row in rows:
            start_s = parse_time(row["start"]).total_seconds()
            stop_s = parse_time(row["stop"]).total_seconds()
            placed = self._placed_at(assignment, start_s)
            if placed is None or placed.kind != RegionKind.gt:
                continue
            offset = placed.file_start - placed.clip_start
            hyp_intervals.append(
                Interval(
                    id=counter,
                    start=(start_s + offset) * 1000.0,
                    stop=(stop_s + offset) * 1000.0,
                    label=row.get("label", "") or "",
                    extra={
                        attr: row.get(attr, "") or "",
                        _GROUP_ATTR: self._honeypot_id(placed),
                    },
                )
            )
            counter += 1

        return gt_intervals, hyp_intervals

    def _download_assignment_tsvs(self, client: StorageClient) -> dict[int, bytes]:
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
    def _resolve_assignment(
        rows: list[dict], assignments: dict[str, Assignment]
    ) -> Assignment | None:
        for row in rows:
            clip = row["filename"].rsplit("/", 1)[-1]
            if clip in assignments:
                return assignments[clip]
        return None

    @staticmethod
    def _honeypot_id(placed: PlacedRegion) -> str:
        # A gt placement is always built from >=1 GT input ROI, so input_ids is non-empty.
        assert placed.input_ids, f"honeypot placement has no input regions: {placed}"
        return ",".join(placed.input_ids)

    @staticmethod
    def _placed_at(assignment: Assignment, clip_time_s: float) -> PlacedRegion | None:
        return next(
            (p for p in assignment.placed if p.clip_start <= clip_time_s < p.clip_stop),
            None,
        )

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
            iv.extra.get(req.text_attribute, "") for iv in sorted(group, key=lambda i: i.start)
        )
        return tokenize(normalizer(joined), granularity=req.granularity)
