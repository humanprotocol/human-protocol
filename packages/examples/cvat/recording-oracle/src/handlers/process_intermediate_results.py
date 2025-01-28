from __future__ import annotations

import csv
import io
import json
import logging
import os
import zipfile
from collections import Counter
from copy import deepcopy
from dataclasses import dataclass
from functools import cached_property
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING, Any, TypeVar

import datumaro as dm
import numpy as np

import src.cvat.api_calls as cvat_api
import src.models.validation as db_models
import src.services.validation as db_service
from src.core.annotation_meta import AnnotationMeta
from src.core.config import Config
from src.core.gt_stats import GtKey, GtStats, ValidationFrameStats
from src.core.types import TaskTypes
from src.core.validation_errors import (
    DatasetValidationError,
    LowAccuracyError,
    TooFewGtError,
    TooSlowAnnotationError,
)
from src.core.validation_meta import JobMeta, ResultMeta, ValidationMeta
from src.core.validation_results import ValidationFailure, ValidationSuccess
from src.db.utils import ForUpdateParams
from src.services.cloud import make_client as make_cloud_client
from src.services.cloud.utils import BucketAccessInfo
from src.utils import grouped
from src.utils.annotations import ProjectLabels
from src.utils.formatting import value_and_percent
from src.utils.zip_archive import extract_zip_archive, write_dir_to_zip_archive

if TYPE_CHECKING:
    from collections.abc import Callable, Sequence

    from sqlalchemy.orm import Session

    from src.core.manifest import TaskManifest
    from src.cvat.interface import QualityReportData

DM_DATASET_FORMAT_MAPPING = {
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_polygons: "coco_instances",
    TaskTypes.image_points: "coco_person_keypoints",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_points: "coco_instances",  # we compare points against boxes
    TaskTypes.image_polygons: "coco_instances",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
}

_JobResults = dict[int, float]

_RejectedJobs = dict[int, DatasetValidationError]

_HoneypotFrameId = int
_ValidationFrameId = int
_HoneypotFrameToValFrame = dict[_HoneypotFrameId, _ValidationFrameId]
_TaskIdToValidationLayout = dict[int, cvat_api.models.ITaskValidationLayoutRead]
_TaskIdToHoneypotsMapping = dict[int, _HoneypotFrameToValFrame]
_TaskIdToFrameNames = dict[int, list[str]]
_TaskIdToLabels = dict[int, list[str]]


@dataclass
class _ValidationResult:
    job_results: _JobResults
    rejected_jobs: _RejectedJobs
    updated_merged_dataset: io.BytesIO
    gt_stats: GtStats
    task_id_to_val_layout: _TaskIdToValidationLayout
    task_id_to_honeypots_mapping: _TaskIdToHoneypotsMapping
    task_id_to_frame_names: _TaskIdToFrameNames
    task_id_to_labels: _TaskIdToLabels


@dataclass
class _AudinoValidationResult:
    job_results: _JobResults
    rejected_jobs: _RejectedJobs
    updated_merged_dataset: io.BytesIO


T = TypeVar("T")


class _TaskValidator:
    UNKNOWN_QUALITY = -1
    "The value to be used when job quality cannot be computed (e.g. no GT images available)"

    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        manifest: TaskManifest,
        *,
        merged_annotations: io.IOBase,
        meta: AnnotationMeta,
        gt_stats: GtStats | None = None,
    ) -> None:
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.manifest = manifest

        self._gt_stats: GtStats = gt_stats or {}
        self._merged_annotations: io.IOBase = merged_annotations

        self._updated_merged_dataset_archive: io.IOBase | None = None
        self._job_results: _JobResults | None = None
        self._rejected_jobs: _RejectedJobs | None = None

        self._temp_dir: Path | None = None
        self._input_gt_dataset: dm.Dataset | None = None
        self._meta: AnnotationMeta = meta

    def _require_field(self, field: T | None) -> T:
        assert field is not None
        return field

    def _gt_key_to_sample_id(self, gt_key: str) -> str:
        return gt_key

    def _parse_gt_dataset(self, gt_file_data: bytes) -> dm.Dataset:
        with TemporaryDirectory() as gt_temp_dir:
            gt_filename = os.path.join(gt_temp_dir, "gt_annotations.json")
            with open(gt_filename, "wb") as f:
                f.write(gt_file_data)

            gt_dataset = dm.Dataset.import_from(
                gt_filename,
                format=DM_GT_DATASET_FORMAT_MAPPING[self.manifest.annotation.type],
            )

            gt_dataset.init_cache()

            return gt_dataset

    def _load_gt_dataset(self):
        input_gt_bucket = BucketAccessInfo.parse_obj(self.manifest.validation.gt_url)
        gt_bucket_client = make_cloud_client(input_gt_bucket)
        gt_data = gt_bucket_client.download_file(input_gt_bucket.path)
        self._input_gt_dataset = self._parse_gt_dataset(gt_data)

    def _validate_jobs(self):
        manifest = self._require_field(self.manifest)
        meta = self._require_field(self._meta)

        job_results: _JobResults = {}
        rejected_jobs: _RejectedJobs = {}

        cvat_task_ids = {job_meta.task_id for job_meta in meta.jobs}

        task_id_to_quality_report_data: dict[int, QualityReportData] = {}
        task_id_to_val_layout: dict[int, cvat_api.models.TaskValidationLayoutRead] = {}
        task_id_to_honeypots_mapping: dict[int, _HoneypotFrameToValFrame] = {}

        # store sequence of frame names for each task
        # task honeypot with frame index matches the sequence[index]
        task_id_to_sequence_of_frame_names: dict[int, list[str]] = {}

        task_id_to_labels: dict[int, list[str]] = {}

        min_quality = manifest.validation.min_quality

        job_id_to_quality_report: dict[int, cvat_api.models.QualityReport] = {}

        for cvat_task_id in cvat_task_ids:
            # obtain quality report details
            task_labels = cvat_api.get_task_labels(cvat_task_id)
            task_quality_report = cvat_api.get_task_quality_report(cvat_task_id)
            task_quality_report_data = cvat_api.get_quality_report_data(task_quality_report.id)
            task_id_to_quality_report_data[cvat_task_id] = task_quality_report_data

            # obtain task validation layout and define honeypots mapping
            task_val_layout = cvat_api.get_task_validation_layout(cvat_task_id)
            task_honeypot_frame_to_real = {
                f: task_val_layout.honeypot_real_frames[idx]
                for idx, f in enumerate(task_val_layout.honeypot_frames)
            }
            task_id_to_val_layout[cvat_task_id] = task_val_layout
            task_id_to_honeypots_mapping[cvat_task_id] = task_honeypot_frame_to_real
            task_id_to_sequence_of_frame_names[cvat_task_id] = [
                frame.name for frame in cvat_api.get_task_data_meta(cvat_task_id).frames
            ]
            task_id_to_labels[cvat_task_id] = task_labels

            # obtain quality reports for each job from the task
            job_id_to_quality_report.update(
                {
                    quality_report.job_id: quality_report
                    for quality_report in cvat_api.get_jobs_quality_reports(task_quality_report.id)
                }
            )

        # accepted jobs from the previous epochs are not included
        for job_meta in meta.jobs:
            cvat_job_id = job_meta.job_id
            cvat_task_id = job_meta.task_id

            # assess quality of the job's honeypots
            task_quality_report_data = task_id_to_quality_report_data[cvat_task_id]
            task_frame_names = task_id_to_sequence_of_frame_names[cvat_task_id]
            task_honeypots = set(task_id_to_val_layout[cvat_task_id].honeypot_frames)
            task_honeypots_mapping = task_id_to_honeypots_mapping[cvat_task_id]
            task_labels = task_id_to_labels[cvat_task_id]

            job_honeypots = task_honeypots & set(job_meta.job_frame_range)
            if not job_honeypots:
                job_results[cvat_job_id] = self.UNKNOWN_QUALITY
                rejected_jobs[cvat_job_id] = TooFewGtError
                continue

            for honeypot in job_honeypots:
                val_frame = task_honeypots_mapping[honeypot]
                val_frame_name = task_frame_names[val_frame]
                val_frame_key = GtKey(filename=val_frame_name, labels=task_labels)

                result = task_quality_report_data.frame_results[str(honeypot)]
                self._gt_stats.setdefault(val_frame_key, ValidationFrameStats())
                self._gt_stats[val_frame_key].accumulated_quality += result.annotations.accuracy

                if result.annotations.accuracy < min_quality:
                    self._gt_stats[val_frame_key].failed_attempts += 1
                else:
                    self._gt_stats[val_frame_key].accepted_attempts += 1

            # assess job quality
            job_quality_report = job_id_to_quality_report[cvat_job_id]

            accuracy = job_quality_report.summary.accuracy

            job_results[cvat_job_id] = accuracy

            if accuracy < min_quality:
                rejected_jobs[cvat_job_id] = LowAccuracyError()

        for gt_stat in self._gt_stats.values():
            gt_stat.total_uses = max(
                gt_stat.total_uses,
                gt_stat.failed_attempts + gt_stat.accepted_attempts,
                # at the first iteration we have no information on total uses
                # from previous iterations, so we derive it from the validation results
            )

        self._job_results = job_results
        self._rejected_jobs = rejected_jobs
        self._task_id_to_val_layout = task_id_to_val_layout
        self._task_id_to_honeypots_mapping = task_id_to_honeypots_mapping
        self._task_id_to_sequence_of_frame_names = task_id_to_sequence_of_frame_names
        self._task_id_to_labels = task_id_to_labels

    def _restore_original_image_paths(self, merged_dataset: dm.Dataset) -> dm.Dataset:
        class RemoveCommonPrefix(dm.ItemTransform):
            def __init__(self, extractor: dm.IExtractor, *, prefix: str) -> None:
                super().__init__(extractor)
                self._prefix = prefix

            def transform_item(self, item: dm.DatasetItem) -> dm.DatasetItem:
                if item.id.startswith(self._prefix):
                    item = item.wrap(id=item.id[len(self._prefix) :])
                return item

        prefix = BucketAccessInfo.parse_obj(self.manifest.data.data_url).path.lstrip("/\\") + "/"

        # Remove prefixes if it can be done safely
        sample_ids = {sample.id for sample in merged_dataset}
        if all(
            sample_id.startswith(prefix) and (sample_id[len(prefix) :] not in sample_ids)
            for sample_id in sample_ids
        ):
            merged_dataset.transform(RemoveCommonPrefix, prefix=prefix)

        return merged_dataset

    def _prepare_merged_dataset(self):
        tempdir = self._require_field(self._temp_dir)
        manifest = self._require_field(self.manifest)
        merged_annotations = self._require_field(self._merged_annotations)
        input_gt_dataset = self._require_field(self._input_gt_dataset)

        merged_dataset_path = tempdir / "merged"
        merged_dataset_format = DM_DATASET_FORMAT_MAPPING[manifest.annotation.type]
        extract_zip_archive(merged_annotations, merged_dataset_path)

        merged_dataset = dm.Dataset.import_from(
            os.fspath(merged_dataset_path), format=merged_dataset_format
        )
        self._restore_original_image_paths(merged_dataset)
        self._put_gt_into_merged_dataset(input_gt_dataset, merged_dataset, manifest=manifest)

        updated_merged_dataset_path = tempdir / "merged_updated"
        merged_dataset.export(
            updated_merged_dataset_path, merged_dataset_format, save_media=False, reindex=True
        )

        updated_merged_dataset_archive = io.BytesIO()
        write_dir_to_zip_archive(updated_merged_dataset_path, updated_merged_dataset_archive)
        updated_merged_dataset_archive.seek(0)

        self._updated_merged_dataset_archive = updated_merged_dataset_archive

    @classmethod
    def _put_gt_into_merged_dataset(
        cls, input_gt_dataset: dm.Dataset, merged_dataset: dm.Dataset, *, manifest: TaskManifest
    ) -> None:
        """
        Updates the merged dataset inplace, writing GT annotations corresponding to the task type.
        """

        match manifest.annotation.type:
            case TaskTypes.image_boxes.value | TaskTypes.image_polygons.value:
                merged_dataset.update(input_gt_dataset)
            case TaskTypes.image_points.value:
                merged_label_cat: dm.LabelCategories = merged_dataset.categories()[
                    dm.AnnotationType.label
                ]

                # we support no more than 1 label so far
                assert len(manifest.annotation.labels) == 1

                skeleton_label_id = next(
                    i for i, label in enumerate(merged_label_cat) if not label.parent
                )
                point_label_id = next(i for i, label in enumerate(merged_label_cat) if label.parent)

                for sample in input_gt_dataset:
                    annotations = [
                        dm.Skeleton(
                            elements=[
                                # Put a point in the center of each GT bbox
                                # Not ideal, but it's the target for now
                                dm.Points(
                                    [bbox.x + bbox.w / 2, bbox.y + bbox.h / 2],
                                    label=point_label_id,
                                    attributes=bbox.attributes,
                                )
                            ],
                            label=skeleton_label_id,
                        )
                        for bbox in sample.annotations
                        if isinstance(bbox, dm.Bbox)
                    ]
                    merged_dataset.put(sample.wrap(annotations=annotations))
            case TaskTypes.image_label_binary.value:
                merged_dataset.update(input_gt_dataset)
            case TaskTypes.image_boxes_from_points:
                merged_dataset.update(input_gt_dataset)
            case TaskTypes.image_skeletons_from_boxes:
                # The original behavior of project_labels is broken for skeletons
                input_gt_dataset = dm.Dataset(input_gt_dataset)
                input_gt_dataset = input_gt_dataset.transform(
                    ProjectLabels, dst_labels=merged_dataset.categories()[dm.AnnotationType.label]
                )
                merged_dataset.update(input_gt_dataset)
            case _:
                raise AssertionError(f"Unknown task type {manifest.annotation.type}")

    def validate(self) -> _ValidationResult:
        with TemporaryDirectory() as tempdir:
            self._temp_dir = Path(tempdir)

            self._load_gt_dataset()
            self._validate_jobs()
            self._prepare_merged_dataset()

        return _ValidationResult(
            job_results=self._require_field(self._job_results),
            rejected_jobs=self._require_field(self._rejected_jobs),
            updated_merged_dataset=self._require_field(self._updated_merged_dataset_archive),
            gt_stats=self._require_field(self._gt_stats),
            task_id_to_val_layout=self._require_field(self._task_id_to_val_layout),
            task_id_to_honeypots_mapping=self._require_field(self._task_id_to_honeypots_mapping),
            task_id_to_frame_names=self._require_field(self._task_id_to_sequence_of_frame_names),
            task_id_to_labels=self._require_field(self._task_id_to_labels),
        )


class _AudinoTaskValidator:
    UNKNOWN_QUALITY = -1
    "The value to be used when job quality cannot be computed (e.g. no GT images available)"

    def __init__(
        self,
        escrow_address: str,
        chain_id: int,
        manifest: TaskManifest,
        *,
        merged_annotations: io.IOBase,
        meta: AnnotationMeta,
        gt_stats: GtStats | None = None,
    ) -> None:
        self.escrow_address = escrow_address
        self.chain_id = chain_id
        self.manifest = manifest

        self._gt_stats: GtStats = gt_stats or {}
        self._merged_annotations: io.IOBase = merged_annotations
        self._job_annotations: dict[int, list[dict[str, Any]]] | None = None

        self._updated_merged_dataset_archive: io.IOBase | None = None
        self._job_results: _JobResults | None = None
        self._rejected_jobs: _RejectedJobs | None = None

        self._temp_dir: Path | None = None
        self._input_gt_dataset = None
        self._meta: AnnotationMeta = meta
        self._base_job_id: int

    def _require_field(self, field: T | None) -> T:
        assert field is not None
        return field

    def _parse_merged_annotations(self) -> dict[int, list[dict[str, Any]]]:
        """Parses task annotations from self.merged_annotations,
        extracting and organizing them by job_id"""

        if self._merged_annotations is None:
            return {}

        job_annotations: dict[int, list[dict[str, Any]]] = {}

        with zipfile.ZipFile(io.BytesIO(self._merged_annotations.getvalue())) as archive:
            if "annotations.json" not in archive.namelist():
                return {}

            with archive.open("annotations.json") as json_file:
                annotations = json.load(json_file)

            for annotation in annotations:
                job_id = annotation.get("job_id")
                if job_id is not None:
                    if job_id not in job_annotations:
                        job_annotations[job_id] = []
                    job_annotations[job_id].append(annotation)

        return job_annotations

    def _parse_audino_gt_annotations(self, gt_dataset_data: bytes, path: str):
        _, ext = os.path.splitext(path)
        ext = ext.lower()

        def convert_value(value: str):
            """Converts a string value to int, float, or keeps it as string."""
            value = value.strip()
            if not value:
                return ""
            try:
                f = float(value)
                if f.is_integer():
                    return int(f)
                return f
            except ValueError:
                return value

        if ext == ".json":
            decoded_data = gt_dataset_data.decode("utf-8")
            return json.loads(decoded_data)
        if ext == ".tsv":
            decoded_data = gt_dataset_data.decode("utf-8")
            data_io = StringIO(decoded_data)
            reader = csv.DictReader(data_io, delimiter="\t")
            return [{key: convert_value(value) for key, value in row.items()} for row in reader]
        return []

    def _load_gt_dataset(self):
        input_gt_bucket = BucketAccessInfo.parse_obj(self.manifest.validation.gt_url)
        gt_bucket_client = make_cloud_client(input_gt_bucket)
        gt_data = gt_bucket_client.download_file(input_gt_bucket.path)
        self._input_gt_dataset = self._parse_audino_gt_annotations(gt_data, input_gt_bucket.path)

    def _validate_jobs(self):
        manifest = self._require_field(self.manifest)
        gt_dataset = self._require_field(self._input_gt_dataset)

        job_results: _JobResults = {}
        rejected_jobs: _RejectedJobs = {}

        comparator = AudinoDatasetComparator(
            min_similarity_threshold=manifest.validation.min_quality,
        )

        self._job_annotations = self._parse_merged_annotations()

        self._base_job_id = min(self._job_annotations.keys(), default=0)
        non_zero_accuracies = []

        for job_cvat_id, job_dataset in self._job_annotations.items():
            try:
                job_mean_accuracy = comparator.compare(
                    gt_dataset,
                    job_dataset,
                    self._base_job_id,  # 0 based indexing used for checking intersecting jobs
                )
            except TooFewGtError as e:
                job_results[job_cvat_id] = self.UNKNOWN_QUALITY
                rejected_jobs[job_cvat_id] = e
                continue

            if job_mean_accuracy > 0:
                non_zero_accuracies.append(job_mean_accuracy)

            job_results[job_cvat_id] = job_mean_accuracy

        if non_zero_accuracies:
            average_accuracy = sum(non_zero_accuracies) / len(non_zero_accuracies)
        else:
            average_accuracy = 0

        for job_cvat_id in self._job_annotations:
            if (
                job_results.get(job_cvat_id, 0) == 0
            ):  # assign average accuracy for jobs which are not included in GT
                job_results[job_cvat_id] = average_accuracy

            if job_results[job_cvat_id] < manifest.validation.min_quality:
                rejected_jobs[job_cvat_id] = TooFewGtError()

        self._job_results = job_results
        self._rejected_jobs = rejected_jobs

    def _prepare_merged_dataset(self):
        tempdir = self._require_field(self._temp_dir)
        gt_dataset = deepcopy(self._require_field(self._input_gt_dataset))

        for gt_sample in gt_dataset:
            gt_sample["job_id"] = int(gt_sample["job_id"]) + self._base_job_id

        gt_annotations_json = json.dumps(gt_dataset, indent=4).encode("utf-8")

        updated_merged_dataset_path = tempdir / "merged_annotations"
        updated_merged_dataset_path.mkdir(parents=True, exist_ok=True)

        updated_merged_dataset_archive = io.BytesIO()

        with zipfile.ZipFile(updated_merged_dataset_archive, "w") as archive:
            with zipfile.ZipFile(
                io.BytesIO(self._merged_annotations.getvalue())
            ) as original_archive:
                with original_archive.open("annotations.json") as annotations_file:
                    annotations_data = json.load(annotations_file)

                    # Modify start and end for each annotation to make time stamps absolute
                    for annotation in annotations_data:
                        job_id = annotation.get("job_id")
                        if job_id is not None:
                            job_time_offset = (
                                (int(job_id) - self._base_job_id)
                                * self.manifest.annotation.segment_duration
                                / 1000
                            )

                            annotation["start"] += job_time_offset
                            annotation["end"] += job_time_offset

                archive.writestr("annotations.json", json.dumps(annotations_data, indent=4))

                for file in original_archive.namelist():
                    if file.startswith("clips/"):
                        archive.writestr(file, original_archive.read(file))

            archive.writestr("gt_annotations.json", gt_annotations_json)

        updated_merged_dataset_archive.seek(0)

        self._updated_merged_dataset_archive = updated_merged_dataset_archive

    def validate(self) -> _AudinoValidationResult:
        with TemporaryDirectory() as tempdir:
            self._temp_dir = Path(tempdir)

            self._load_gt_dataset()
            self._validate_jobs()
            self._prepare_merged_dataset()

        return _AudinoValidationResult(
            job_results=self._require_field(self._job_results),
            rejected_jobs=self._require_field(self._rejected_jobs),
            updated_merged_dataset=self._require_field(self._updated_merged_dataset_archive),
        )


class AudinoDatasetComparator:
    def __init__(self, min_similarity_threshold: float):
        self._min_similarity_threshold = min_similarity_threshold
        self.failed_gts = set()

    def iou(self, start1: float, end1: float, start2: float, end2: float) -> float:
        """Calculate IoU for time intervals."""
        intersection = max(0, min(end1, end2) - max(start1, start2))
        union = (end1 - start1) + (end2 - start2) - intersection
        return intersection / union if union > 0 else 0.0

    def word_error_rate(self, gt_sentence: str, ds_sentence: str) -> float:
        """Calculate Word Error Rate (WER)."""
        gt_words = gt_sentence.split()
        ds_words = ds_sentence.split()

        # Dynamic programming approach for WER calculation
        dp = [[0] * (len(ds_words) + 1) for _ in range(len(gt_words) + 1)]
        for i in range(len(gt_words) + 1):
            for j in range(len(ds_words) + 1):
                if i == 0:
                    dp[i][j] = j
                elif j == 0:
                    dp[i][j] = i
                else:
                    cost = 0 if gt_words[i - 1] == ds_words[j - 1] else 1
                    dp[i][j] = min(
                        dp[i - 1][j] + 1,  # Deletion
                        dp[i][j - 1] + 1,  # Insertion
                        dp[i - 1][j - 1] + cost,  # Substitution
                    )
        return dp[len(gt_words)][len(ds_words)] / max(len(gt_words), 1)

    def compare(
        self,
        gt_dataset: list[dict[str, str]],
        ds_dataset: list[dict[str, str]],
        base_index: int,
    ) -> float:
        """
        Compare ground truth (gt_dataset) and dataset (ds_dataset) annotations and return accuracy.
        Incorporates WER average into final accuracy.

        wer_score: Defines the percentage of words matched between two transcriptions.
        It is calculated as (1 - WER), where WER is the word error rate, which measures
        the errors (insertions, deletions, and substitutions) between two transcriptions.

        Args:
        - gt_dataset: List of ground truth annotations (job_id is 0-based index).
        - ds_dataset: List of dataset annotations (job_id is actual index).
        - base_index: Base index used to map gt job_id to ds job_id.
        """
        matched_annotations = 0
        matched_wers = []
        dataset_failed_gts = set()

        ds_job_ids = {sample["job_id"] for sample in ds_dataset}
        gt_samples_filtered = [
            gt for gt in gt_dataset if (base_index + int(gt["job_id"])) in ds_job_ids
        ]

        # if gt_samples_filtered is None:
        #     raise TooFewGtError

        used_ds_indices = set()

        for gt in gt_samples_filtered:
            mapped_job_id = base_index + int(gt["job_id"])  # Map GT job_id to DS job_id
            best_match_idx = -1
            best_wer = 0

            for idx, ds in enumerate(ds_dataset):
                if ds["job_id"] != mapped_job_id or idx in used_ds_indices:
                    continue

                iou_score = self.iou(
                    float(gt["start"]), float(gt["end"]), float(ds["start"]), float(ds["end"])
                )
                if iou_score < 0.6:
                    continue

                wer_score = max(
                    0, 1 - self.word_error_rate(gt.get("sentence", ""), ds.get("sentence", ""))
                )
                if wer_score > 0.6:
                    best_match_idx = idx
                    best_wer = wer_score

            if best_match_idx != -1:
                matched_annotations += 1
                matched_wers.append(best_wer)
                used_ds_indices.add(best_match_idx)
            else:
                dataset_failed_gts.add(gt["job_id"])

        total_relevant_annotations = 2 * max(len(gt_samples_filtered), len(ds_dataset))
        if total_relevant_annotations > 0:
            accuracy = (2 * matched_annotations) / total_relevant_annotations
            if matched_wers:
                average_wer = sum(matched_wers) / len(matched_wers)
                accuracy *= average_wer  # Scale accuracy by average WER score
        else:
            accuracy = 0.0

        self.failed_gts = dataset_failed_gts

        return max(accuracy, 0.0)


@dataclass
class _HoneypotUpdateResult:
    updated_gt_stats: GtStats
    can_continue_annotation: bool


_K = TypeVar("_K")


class _TaskHoneypotManager:
    def __init__(
        self,
        task: db_models.Task,
        manifest: TaskManifest,
        *,
        annotation_meta: AnnotationMeta,
        gt_stats: GtStats,
        validation_result: _ValidationResult,
        logger: logging.Logger,
        rng: np.random.Generator | None = None,
    ):
        self.task = task
        self.logger = logger
        self.annotation_meta = annotation_meta
        self.gt_stats = gt_stats
        self.validation_result = validation_result
        self.manifest = manifest

        self._job_annotation_meta_by_job_id = {
            meta.job_id: meta for meta in self.annotation_meta.jobs
        }

        if not rng:
            rng = np.random.default_rng()
        self.rng = rng

    @cached_property
    def _gt_frame_uses(self) -> dict[GtKey, int]:
        return {gt_key: gt_stat.total_uses for gt_key, gt_stat in self.gt_stats.items()}

    def _select_random_least_used(
        self,
        items: Sequence[_K],
        count: int,
        *,
        key: Callable[[_K], int] | None = None,
        rng: np.random.Generator | None = None,
    ) -> Sequence[_K]:
        """
        Selects 'count' least used items randomly, without repetition.
        'key' can be used to provide a custom item count function.
        """
        if not rng:
            rng = self.rng

        if not key:
            item_counts = Counter(items)
            key = item_counts.__getitem__

        pick = set()
        for randval in rng.random(count):
            # TODO: optimize like in https://github.com/cvat-ai/cvat/pull/8857 if needed
            least_use_count = min(key(item) for item in items if item not in pick)
            least_used_items = [
                item for item in items if key(item) == least_use_count if item not in pick
            ]
            pick.add(least_used_items[int(randval * len(least_used_items))])

        return pick

    def _get_available_gt(self) -> tuple[GtStats, dict[int, set[GtKey]]]:
        task_id_to_gt_keys = {}
        for task_id, task_val_layout in self.validation_result.task_id_to_val_layout.items():
            # Here we assume that all the tasks with the same label set use the same GT frames
            task_validation_frames = task_val_layout.validation_frames
            task_frame_names = self.validation_result.task_id_to_frame_names[task_id]
            task_labels = self.validation_result.task_id_to_labels[task_id]
            task_gt_keys = {
                GtKey(filename=task_frame_names[f], labels=task_labels)
                for f in task_validation_frames
            }

            # Populate missing entries for unused GT frames.
            # Not all the GT frames may be present in an iteration results.
            for gt_key in task_gt_keys:
                if gt_key not in self.gt_stats:
                    self.gt_stats[gt_key] = ValidationFrameStats()

            task_id_to_gt_keys[task_id] = task_gt_keys

        if max_gt_share := Config.validation.max_gt_share:
            # Limit maximum used GT frames in the dataset. This allows us to get strong
            # guarantees about GT frame uses during validation,
            # resulting in clear exclusion rates of complex or invalid GT.
            # Count GT frames per label set to avoid situations with empty GT sets
            # for some labels or tasks after limiting GT percent in the whole dataset.
            # Note that different task types can have different label setups in tasks, e.g.
            # - skeleton tasks have 1 point label per task
            # - bbox tasks may have several labels per task
            # All these cases are expected to use the same GT per label set.
            for label_set_task_ids in grouped(
                self.validation_result.task_id_to_labels,
                key=lambda t: frozenset(self.validation_result.task_id_to_labels[t]),
            ).values():
                regular_frames_count = 0
                gt_keys = None

                for task_id in label_set_task_ids:
                    task_gt_keys = task_id_to_gt_keys[task_id]
                    if gt_keys is None:
                        gt_keys = task_gt_keys
                    else:
                        # Assume that all the tasks with the same label set use the same GT
                        assert gt_keys == task_gt_keys

                    task_val_layout = self.validation_result.task_id_to_val_layout[task_id]
                    task_frame_names = self.validation_result.task_id_to_frame_names[task_id]
                    task_regular_frames_count = (
                        len(task_frame_names) - len(task_gt_keys) - task_val_layout.honeypot_count
                    )

                    regular_frames_count += task_regular_frames_count

                assert gt_keys is not None

                gt_frames_count = len(gt_keys)
                total_frames_count = regular_frames_count + gt_frames_count
                enabled_gt_keys = {k for k in gt_keys if self.gt_stats[k].enabled}
                current_gt_share = len(enabled_gt_keys) / (total_frames_count or 1)
                max_usable_gt_share = min(gt_frames_count / (total_frames_count or 1), max_gt_share)
                max_gt_count = min(int(max_gt_share * total_frames_count), gt_frames_count)
                has_updates = False
                if max_gt_count < len(enabled_gt_keys):
                    # disable some validation frames, take the least used ones
                    pick = self._select_random_least_used(
                        enabled_gt_keys,
                        count=len(enabled_gt_keys) - max_gt_count,
                        key=lambda k: self.gt_stats[k].total_uses,
                    )

                    enabled_gt_keys.difference_update(pick)
                    has_updates = True
                elif (
                    # Allow restoring GT frames on max limit config changes
                    current_gt_share < max_usable_gt_share
                ):
                    # add more validation frames, take the most used ones
                    pick = self._select_random_least_used(
                        enabled_gt_keys,
                        count=max_gt_count - len(enabled_gt_keys),
                        key=lambda k: -self.gt_stats[k].total_uses,
                    )

                    enabled_gt_keys.update(pick)
                    has_updates = True

                if has_updates:
                    for gt_key in gt_keys:
                        self.gt_stats[gt_key].enabled = gt_key in enabled_gt_keys

        return {
            gt_key
            for gt_key, gt_stat in self.gt_stats.items()
            if gt_stat.enabled
            if gt_stat.rating > 1 - self.manifest.validation.min_quality
        }, task_id_to_gt_keys

    def _check_warmup_annotation_speed(self):
        validation_result = self.validation_result
        rejected_jobs = validation_result.rejected_jobs

        current_iteration = self.task.iteration + 1
        total_jobs_count = len(self.annotation_meta.jobs)
        completed_jobs_count = total_jobs_count - len(rejected_jobs)
        current_progress = completed_jobs_count / (total_jobs_count or 1) * 100
        if (
            (Config.validation.warmup_iterations > 0)
            and (Config.validation.min_warmup_progress > 0)
            and (Config.validation.warmup_iterations <= current_iteration)
            and (current_progress < Config.validation.min_warmup_progress)
        ):
            self.logger.warning(
                f"Escrow validation failed for escrow_address={self.task.escrow_address}:"
                f" progress is too slow. Min required {Config.validation.min_warmup_progress:.2f}%"
                f" after the first {Config.validation.warmup_iterations} iterations,"
                f" got {current_progress:.2f} after the {current_iteration} iteration."
                " Annotation will be stopped for a manual review."
            )
            raise TooSlowAnnotationError(
                current_progress=current_progress, current_iteration=current_iteration
            )

    def update_honeypots(self) -> _HoneypotUpdateResult:
        gt_stats = self.gt_stats
        validation_result = self.validation_result
        rejected_jobs = validation_result.rejected_jobs

        # Update honeypots in jobs
        all_available_gt_keys, task_id_to_gt_keys = self._get_available_gt()

        if self.logger.isEnabledFor(logging.DEBUG):
            self.logger.debug(
                "Escrow validation for escrow_address={}: iteration: {}"
                ", available GT count: {} ({:.4f}%, banned {})"
                ", remaining jobs count: {} ({:.4f}%)".format(
                    self.task.escrow_address,
                    self.task.iteration,
                    *value_and_percent(len(all_available_gt_keys), len(gt_stats)),
                    len(gt_stats) - len(all_available_gt_keys),
                    *value_and_percent(len(rejected_jobs), len(self.annotation_meta.jobs)),
                ),
            )

        should_complete = False

        self._check_warmup_annotation_speed()

        gt_frame_uses = self._gt_frame_uses

        tasks_with_rejected_jobs = grouped(
            rejected_jobs, key=lambda jid: self._job_annotation_meta_by_job_id[jid].task_id
        )

        # Update honeypots in rejected jobs
        for cvat_task_id, task_rejected_jobs in tasks_with_rejected_jobs.items():
            if not task_rejected_jobs:
                continue

            task_gt_keys = task_id_to_gt_keys[cvat_task_id]
            task_available_gt_keys = task_gt_keys.intersection(all_available_gt_keys)
            if (
                len(task_available_gt_keys) / len(task_gt_keys)
                < Config.validation.min_available_gt_threshold
            ):
                self.logger.warning(
                    f"Validation for escrow_address={self.task.escrow_address}: "
                    f"Too many validation frames excluded in the task {cvat_task_id} "
                    f"(required: {Config.validation.min_available_gt_threshold * 100:.4f}%, "
                    f"left: {(len(task_available_gt_keys) / len(task_gt_keys)):.4f}%), "
                    "stopping annotation"
                )
                return _HoneypotUpdateResult(
                    updated_gt_stats=gt_stats, can_continue_annotation=False
                )

            task_validation_layout = validation_result.task_id_to_val_layout[cvat_task_id]

            if len(task_available_gt_keys) < task_validation_layout.frames_per_job_count:
                # TODO: value from the manifest can be different from what's in the task
                # because exchange oracle can use size multipliers for tasks
                # Need to sync these values later (maybe by removing it from the manifest)
                self.logger.warning(
                    f"Validation for escrow_address={self.task.escrow_address}: "
                    f"Too few validation frames left in the task {cvat_task_id} "
                    f"(required: {task_validation_layout.frames_per_job_count}, "
                    f"left: {len(task_available_gt_keys)}), "
                    "stopping annotation"
                )
                return _HoneypotUpdateResult(
                    updated_gt_stats=gt_stats, can_continue_annotation=False
                )

            task_frame_names = validation_result.task_id_to_frame_names[cvat_task_id]
            task_labels = validation_result.task_id_to_labels[cvat_task_id]
            task_validation_frame_to_gt_key = {
                validation_frame: GtKey(
                    filename=task_frame_names[validation_frame], labels=task_labels
                )
                for validation_frame in task_validation_layout.validation_frames
            }

            task_available_validation_frames = [
                validation_frame
                for validation_frame in task_validation_layout.validation_frames
                if task_validation_frame_to_gt_key[validation_frame] in task_available_gt_keys
            ]

            task_honeypot_to_index: dict[int, int] = {
                honeypot: i for i, honeypot in enumerate(task_validation_layout.honeypot_frames)
            }  # honeypot -> honeypot list index

            task_updated_honeypot_real_frames = task_validation_layout.honeypot_real_frames.copy()

            for job_id in task_rejected_jobs:
                job_frame_range = self._job_annotation_meta_by_job_id[job_id].job_frame_range
                job_honeypots = sorted(
                    set(task_validation_layout.honeypot_frames).intersection(job_frame_range)
                )

                # Choose new unique validation frames for the job
                job_validation_frames = self._select_random_least_used(
                    task_available_validation_frames,
                    count=len(job_honeypots),
                    key=lambda k: gt_frame_uses[task_validation_frame_to_gt_key[k]],
                )
                for job_honeypot, job_validation_frame in zip(
                    job_honeypots, job_validation_frames, strict=False
                ):
                    gt_frame_uses[task_validation_frame_to_gt_key[job_validation_frame]] += 1
                    honeypot_index = task_honeypot_to_index[job_honeypot]
                    task_updated_honeypot_real_frames[honeypot_index] = job_validation_frame

                # Make sure honeypots do not repeat in jobs
                assert len(
                    {
                        task_updated_honeypot_real_frames[task_honeypot_to_index[honeypot]]
                        for honeypot in job_honeypots
                    }
                ) == len(job_honeypots)

            # Don't use disabled frames to avoid request fails because of
            # the already accepted jobs with (possibly newly) excluded frames.
            # The updated honeypots will include unmodified jobs as well.
            cvat_api.update_task_validation_layout(
                cvat_task_id,
                honeypot_real_frames=task_updated_honeypot_real_frames,
            )

        # Update GT use counts
        for gt_key, gt_stat in gt_stats.items():
            gt_stat.total_uses = gt_frame_uses[gt_key]

        return _HoneypotUpdateResult(
            updated_gt_stats=gt_stats, can_continue_annotation=not should_complete
        )


def process_intermediate_results(  # noqa: PLR0912
    session: Session,
    *,
    escrow_address: str,
    chain_id: int,
    meta: AnnotationMeta,
    merged_annotations: io.RawIOBase,
    manifest: TaskManifest,
    logger: logging.Logger,
) -> ValidationSuccess | ValidationFailure:
    should_complete = False

    task = db_service.get_task_by_escrow_address(
        session,
        escrow_address,
        for_update=ForUpdateParams(
            nowait=True
        ),  # should not happen, but waiting should not block processing
    )
    if task:
        # Skip assignments that were validated earlier
        validated_assignment_ids = {
            validation_result.assignment_id
            for validation_result in db_service.get_task_validation_results(session, task.id)
        }
        unchecked_jobs_meta = meta.skip_assignments(validated_assignment_ids)
    else:
        # Recording Oracle task represents all CVAT tasks related with the escrow
        task_id = db_service.create_task(session, escrow_address=escrow_address, chain_id=chain_id)
        task = db_service.get_task_by_id(session, task_id, for_update=True)
        unchecked_jobs_meta = meta

    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("process_intermediate_results for escrow %s", escrow_address)
        logger.debug("Task id %s, %s", getattr(task, "id", None), getattr(task, "__dict__", None))

    gt_stats = {
        gt_stat.gt_key: ValidationFrameStats(
            failed_attempts=gt_stat.failed_attempts,
            accepted_attempts=gt_stat.accepted_attempts,
            accumulated_quality=gt_stat.accumulated_quality,
            total_uses=gt_stat.total_uses,
            enabled=gt_stat.enabled,
        )
        for gt_stat in db_service.get_task_gt_stats(session, task.id)
    }

    if manifest.annotation.type == TaskTypes.audio_transcription:
        validator_type = _AudinoTaskValidator
    else:
        validator_type = _TaskValidator

    validator = validator_type(
        escrow_address=escrow_address,
        chain_id=chain_id,
        manifest=manifest,
        merged_annotations=merged_annotations,
        meta=unchecked_jobs_meta,
        gt_stats=gt_stats,
    )

    validation_result = validator.validate()
    job_results = validation_result.job_results
    rejected_jobs = validation_result.rejected_jobs

    if logger.isEnabledFor(logging.DEBUG):
        logger.debug("Validation results %s", validation_result)
        logger.debug(
            "Task validation results for escrow_address=%s: %s",
            escrow_address,
            ", ".join(f"{k}: {v:.2f}" for k, v in job_results.items()),
        )

    if manifest.annotation.type == TaskTypes.audio_transcription:
        if (Config.validation.max_escrow_iterations > 0) and (
            Config.validation.max_escrow_iterations <= task.iteration
        ):
            logger.info(
                f"Validation for escrow_address={escrow_address}:"
                f" too many iterations, stopping annotation"
            )
            should_complete = True
    else:
        gt_stats = validation_result.gt_stats

        if (Config.validation.max_escrow_iterations > 0) and (
            Config.validation.max_escrow_iterations <= task.iteration
        ):
            logger.info(
                f"Validation for escrow_address={escrow_address}:"
                f" too many iterations, stopping annotation"
            )
            should_complete = True
        elif rejected_jobs and gt_stats:
            honeypot_manager = _TaskHoneypotManager(
                task,
                manifest,
                annotation_meta=meta,
                gt_stats=gt_stats,
                validation_result=validation_result,
                logger=logger,
            )

            honeypot_update_result = honeypot_manager.update_honeypots()
            if not honeypot_update_result.can_continue_annotation:
                should_complete = True

            gt_stats = honeypot_update_result.updated_gt_stats

        if gt_stats:
            if logger.isEnabledFor(logging.DEBUG):
                logger.debug("Updating GT stats: %s", gt_stats)

            db_service.update_gt_stats(session, task.id, gt_stats)

    job_final_result_ids: dict[int, str] = {}

    for job_meta in meta.jobs:
        job = db_service.get_job_by_cvat_id(session, job_meta.job_id)
        if not job:
            job_id = db_service.create_job(session, task_id=task.id, job_cvat_id=job_meta.job_id)
            job = db_service.get_job_by_id(session, job_id)

        assignment_validation_result = db_service.get_validation_result_by_assignment_id(
            session, job_meta.assignment_id
        )
        if not assignment_validation_result:
            assignment_validation_result_id = db_service.create_validation_result(
                session,
                job_id=job.id,
                annotator_wallet_address=job_meta.annotator_wallet_address,
                annotation_quality=job_results[job_meta.job_id],
                assignment_id=job_meta.assignment_id,
            )
        else:
            assignment_validation_result_id = assignment_validation_result.id

        # We consider only the last assignment as final even if there were assignments with higher
        # quality score. The reason for this is that during escrow annotation there are various
        # task changes possible, for instance:
        # - GT can be changed in the middle of the task annotation
        # - manifest can be updated with different quality parameters
        # etc. It can be considered more of a development or testing conditions so far,
        # according to the current system requirements, but it's likely to be
        # a normal requirement in the future.
        # Therefore, we use the logic: only the last job assignment can be considered
        # a final annotation result, regardless of the assignment quality.
        job_final_result_ids[job.id] = assignment_validation_result_id

    task_jobs = task.jobs

    db_service.update_escrow_iteration(session, escrow_address, chain_id, task.iteration + 1)

    if not should_complete:
        total_jobs = len(task_jobs)
        unverifiable_jobs_count = len(
            [v for v in rejected_jobs.values() if isinstance(v, TooFewGtError)]
        )
        if (
            total_jobs * Config.validation.unverifiable_assignments_threshold
            < unverifiable_jobs_count
        ):
            logger.info(
                f"Validation for escrow_address={escrow_address}: "
                f"too many assignments have insufficient GT for validation "
                f"({unverifiable_jobs_count} of {total_jobs} "
                f"({unverifiable_jobs_count / total_jobs * 100:.2f}%)), stopping annotation"
            )
            should_complete = True
        elif len(rejected_jobs) == unverifiable_jobs_count:
            if unverifiable_jobs_count:
                logger.info(
                    f"Validation for escrow_address={escrow_address}: "
                    f"only unverifiable assignments left ({unverifiable_jobs_count}),"
                    f" stopping annotation"
                )

            should_complete = True

    if not should_complete:
        return ValidationFailure(job_results=job_results, rejected_jobs=rejected_jobs)

    task_validation_results = db_service.get_task_validation_results(session, task.id)

    job_id_to_meta_id = {job.id: i for i, job in enumerate(task_jobs)}

    validation_result_id_to_meta_id = {r.id: i for i, r in enumerate(task_validation_results)}

    validation_meta = ValidationMeta(
        jobs=[
            JobMeta(
                job_id=job_id_to_meta_id[job.id],
                final_result_id=validation_result_id_to_meta_id[job_final_result_ids[job.id]],
            )
            for job in task_jobs
        ],
        results=[
            ResultMeta(
                id=validation_result_id_to_meta_id[r.id],
                job_id=job_id_to_meta_id[r.job.id],
                annotator_wallet_address=r.annotator_wallet_address,
                annotation_quality=r.annotation_quality,
            )
            for r in task_validation_results
        ],
    )

    return ValidationSuccess(
        job_results=job_results,
        validation_meta=validation_meta,
        resulting_annotations=validation_result.updated_merged_dataset.getvalue(),
        average_quality=np.mean(
            [v for v in job_results.values() if v != _TaskValidator.UNKNOWN_QUALITY and v >= 0]
            or [0]
        ),
    )


def parse_annotation_metafile(metafile: io.RawIOBase) -> AnnotationMeta:
    return AnnotationMeta.model_validate_json(metafile.read())


def serialize_validation_meta(validation_meta: ValidationMeta) -> bytes:
    return validation_meta.model_dump_json().encode()
