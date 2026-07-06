from __future__ import annotations

import csv
import io
import random
import uuid
from collections import Counter
from math import ceil
from pathlib import Path, PurePosixPath
from tempfile import TemporaryDirectory
from typing import TYPE_CHECKING

import src.cvat.api_calls as cvat_api
import src.services.cvat as db_service
from src.core.config import Config
from src.core.storage import compose_data_bucket_filename
from src.core.tasks import TaskTypes
from src.core.tasks.audio_transcription.meta import (
    Assignment,
    InputGtRegion,
    InputRegion,
    PlacedRegion,
    PresentedRegion,
    RegionKind,
    TaskMetaLayout,
    TaskMetaSerializer,
    parse_time,
)
from src.core.tasks.audio_transcription.spec import parse_audio_manifest
from src.core.types import TaskStatuses
from src.db import SessionLocal
from src.handlers.job_creation.builders.vision.base import TaskBuilderBase
from src.handlers.job_creation.exceptions import (
    DatasetValidationError,
    ExcludedAnnotationsInfo,
    TooFewSamples,
)
from src.handlers.job_creation.utils import (
    MaybeUnset,
    make_cvat_cloud_storage_params,
    unset,
)
from src.models.cvat import Project
from src.services.cloud.utils import BucketAccessInfo
from src.utils.audio import RegionCut, cut_and_concat, probe_duration
from src.utils.logging import format_sequence

if TYPE_CHECKING:
    from src.core.manifest import ManifestBase


# --------------------------------------------------------------------------- #
# Assignment construction
# --------------------------------------------------------------------------- #


def _bundle_regions(
    regions: list[InputRegion], *, min_duration: float, max_duration: float
) -> list[tuple[float, float, list[InputRegion]]]:
    """
    Bundle consecutive input regions (sorted by start) into groups >= min_duration;
    a region already >= min_duration stays alone. Returns (start_s, stop_s, members) per bundle.

    A bundle's span (first ROI start .. last ROI stop) includes the gaps between its members, so
    two limits keep bundles from ballooning over sparse input:
    - max_duration caps the presented span (a longer bundle would fail input validation anyway);
    - the join gap is capped at min_duration, so we never bridge a long silence between ROIs.
    """

    def span(group: list[InputRegion]) -> float:
        return group[-1].stop.total_seconds() - group[0].start.total_seconds()

    def joinable(group: list[InputRegion], region: InputRegion) -> bool:
        gap = region.start.total_seconds() - group[-1].stop.total_seconds()
        reach = region.stop.total_seconds() - group[0].start.total_seconds()
        return span(group) < min_duration and gap <= min_duration and reach <= max_duration

    out: list[list[InputRegion]] = []
    bundle: list[InputRegion] | None = None
    for region in regions:
        if bundle is None:
            bundle = [region]
        elif joinable(bundle, region):
            bundle.append(region)
        else:
            out.append(bundle)
            bundle = [region]

    if bundle is not None:  # trailing bundle may stay shorter than min_duration
        out.append(bundle)

    return [(g[0].start.total_seconds(), g[-1].stop.total_seconds(), g) for g in out]


def select_honeypots(
    regions: list[InputGtRegion],
    *,
    source_filename: str,
    val_fraction: float,
    min_duration: float,
    max_duration: float,
    random_seed: int = 0,
) -> list[PresentedRegion]:
    """
    Bundle GT cues into >= min_duration groups, then pick ~val_fraction of the bundles (by count)
    as honeypots. A bundle spans its first cue start to its last cue stop (including inter-cue
    gaps); we never pad into unannotated media, so a bundle may stay shorter than min_duration when
    the source GT does not provide enough context.
    """

    regions = sorted(regions, key=lambda r: r.start)
    bundles = _bundle_regions(regions, min_duration=min_duration, max_duration=max_duration)

    rng = random.Random(random_seed)  # noqa: S311  # not cryptographic
    idxs = list(range(len(bundles)))
    rng.shuffle(idxs)
    n_select = ceil(val_fraction * len(bundles))
    chosen = sorted(idxs[:n_select])

    honeypots: list[PresentedRegion] = []
    for bundle_idx in chosen:
        s, e, members = bundles[bundle_idx]
        honeypots.append(
            PresentedRegion(
                source_filename=source_filename,
                start=s,
                stop=e,
                kind=RegionKind.gt,
                input_ids=[m.id for m in members],
            )
        )
    return honeypots


def plan_assignments(
    ds_regions: list[PresentedRegion],
    honeypots: list[PresentedRegion],
    *,
    composition: tuple[int, int],
    validation_overhead: float,
    max_audio_duration: float,
    random_seed: int = 0,
) -> list[list[PresentedRegion]]:
    """
    Mix DS and honeypots into assignments. Returns ordered region lists.
    """

    # 1. shuffle DS
    rng = random.Random(random_seed)  # noqa: S311  # not cryptographic
    ds_order = list(range(len(ds_regions)))
    rng.shuffle(ds_order)

    # 2. Reservoir-pack each assignment up to the DS budget (>= K_min), inject least-used honeypots
    # up to the validation overhead (>= H_min), then shuffle region order. Deterministic.
    ds_budget = max_audio_duration * (1.0 - validation_overhead)
    hp_target = validation_overhead * max_audio_duration
    h_min, k_min = composition

    hp_use: Counter = Counter()
    assignments: list[list[PresentedRegion]] = []
    di = 0
    while di < len(ds_order):
        chosen: list[PresentedRegion] = []
        ds_dur = 0.0
        while di < len(ds_order):
            r = ds_regions[ds_order[di]]
            d = r.duration
            if len(chosen) >= k_min and ds_dur + d > ds_budget:
                break
            chosen.append(r)
            ds_dur += d
            di += 1
        if len(chosen) < k_min:
            break  # DS stream exhausted - can't form a full assignment

        hp_dur = 0.0
        # least-used honeypots first, randomized within each use-count tier
        hp_ranked = sorted(range(len(honeypots)), key=lambda i: (hp_use[i], rng.random()))
        for n_hp, i in enumerate(hp_ranked):
            if (hp_dur >= hp_target and n_hp >= h_min) or n_hp >= len(honeypots):
                break
            chosen.append(honeypots[i])
            hp_dur += honeypots[i].duration
            hp_use[i] += 1

        rng.shuffle(chosen)
        assignments.append(chosen)

    return assignments


def place_regions(
    regions: list[PresentedRegion], *, pause_s: float
) -> tuple[list[PlacedRegion], float]:
    """Clip-time placement of concatenated regions (region durations + inter-region pauses)."""
    placed: list[PlacedRegion] = []
    t = 0.0
    n = len(regions)
    for i, region in enumerate(regions):
        dur = region.duration
        placed.append(
            PlacedRegion(
                index=i,
                source_filename=region.source_filename,
                file_start=region.start,
                file_stop=region.stop,
                clip_start=t,
                clip_stop=t + dur,
                kind=region.kind,
                input_ids=region.input_ids,
            )
        )
        t += dur
        if i < n - 1:
            t += pause_s
    return placed, t


def _overlaps(a0: float, a1: float, b0: float, b1: float) -> bool:
    return a0 < b1 and b0 < a1


# --------------------------------------------------------------------------- #
# Builder
# --------------------------------------------------------------------------- #


class AudioTranscriptionTaskBuilder(TaskBuilderBase):
    def __init__(self, manifest: ManifestBase, escrow_address: str, chain_id: int) -> None:
        super().__init__(manifest=manifest, escrow_address=escrow_address, chain_id=chain_id)

        self.spec = parse_audio_manifest(self.manifest)

        self._media_dir: MaybeUnset[Path] = unset
        self._media_paths: MaybeUnset[dict[str, Path]] = unset  # source_filename -> local path
        self._regions_by_file: MaybeUnset[dict[str, list[InputRegion]]] = unset
        self._gt_by_file: MaybeUnset[dict[str, list[InputGtRegion]]] = unset
        self._regions_tsv_data: MaybeUnset[bytes] = unset  # raw input regions TSV
        self._gt_tsv_data: MaybeUnset[bytes] = unset  # raw input GT TSV
        self._ds_regions: MaybeUnset[list[PresentedRegion]] = unset
        self._honeypots: MaybeUnset[list[PresentedRegion]] = unset
        self._assignments: MaybeUnset[list[Assignment]] = unset
        self._excluded_gt_info: MaybeUnset[ExcludedAnnotationsInfo] = unset

        self._meta_serializer = TaskMetaSerializer()
        self._meta_layout = TaskMetaLayout()

    # -- input ------------------------------------------------------------- #

    def _download_input_data(self) -> None:
        media_bucket = BucketAccessInfo.parse_obj(self.spec.data.media_url)
        regions_bucket = BucketAccessInfo.parse_obj(self.spec.data.regions_url)
        gt_bucket = BucketAccessInfo.parse_obj(self.spec.data.gt_url)

        media_client = self._make_cloud_storage_client(media_bucket)
        regions_client = self._make_cloud_storage_client(regions_bucket)
        gt_client = self._make_cloud_storage_client(gt_bucket)

        regions_tsv_data = regions_client.download_file(regions_bucket.path)
        gt_tsv_data = gt_client.download_file(gt_bucket.path)
        regions_by_file = _parse_regions_tsv(regions_tsv_data)
        gt_by_file = _parse_gt_tsv(gt_tsv_data)

        # download only the referenced media files
        referenced = set(regions_by_file) | set(gt_by_file)
        media_dir = Path(self.exit_stack.enter_context(TemporaryDirectory()))
        media_paths: dict[str, Path] = {}
        for filename in sorted(referenced):
            local_path = media_dir / PurePosixPath(filename)
            local_path.parent.mkdir(parents=True, exist_ok=True)

            data = media_client.download_file(_bucket_key(media_bucket.path, filename))
            local_path.write_bytes(data)
            media_paths[filename] = local_path

        self._media_dir = media_dir
        self._media_paths = media_paths
        self._regions_by_file = regions_by_file
        self._gt_by_file = gt_by_file
        self._regions_tsv_data = regions_tsv_data
        self._gt_tsv_data = gt_tsv_data

    # -- region pools ------------------------------------------------------ #

    def _prepare_rois(self) -> None:
        self._build_gt_regions()
        self._build_ds_regions()

    def _build_gt_regions(self) -> None:
        assert self._gt_by_file is not unset
        assert self._media_paths is not unset

        excluded_gt = ExcludedAnnotationsInfo()
        honeypots: list[PresentedRegion] = []

        for filename in sorted(self._gt_by_file):
            file_duration = probe_duration(self._media_paths[filename])
            valid_regions = _validate_gt_regions(
                self._gt_by_file[filename],
                filename,
                file_duration,
                self.spec.details.roi_max_duration.total_seconds(),
                excluded_gt,
            )
            if not valid_regions:
                continue

            honeypots.extend(
                select_honeypots(
                    valid_regions,
                    source_filename=filename,
                    val_fraction=1.0,  # use all GT as honeypots (rotation is a future feature)
                    min_duration=self.spec.details.roi_min_duration.total_seconds(),
                    max_duration=self.spec.details.roi_max_duration.total_seconds(),
                    random_seed=self.spec.details.random_seed,
                )
            )

        if excluded_gt.excluded_count:
            self.logger.warning(
                "Some GT regions were excluded due to errors found: \n{}".format(
                    format_sequence([m.message for m in excluded_gt.messages], separator="\n")
                )
            )
        if excluded_gt.excluded_count > ceil(
            excluded_gt.total_count * self.spec.details.max_discarded_gt
        ):
            raise TooFewSamples(
                "Too many GT regions discarded, canceling job creation. Errors: {}".format(
                    format_sequence([m.message for m in excluded_gt.messages])
                )
            )

        h_min = self.spec.details.min_composition[0]
        if len(honeypots) < h_min:
            raise TooFewSamples(
                f"Too few ground-truth honeypots after filtering ({len(honeypots)}), "
                f"at least {h_min} required."
            )

        self._honeypots = honeypots
        self._excluded_gt_info = excluded_gt

    # -- dataset regions --------------------------------------------------- #

    def _build_ds_regions(self) -> None:
        assert self._regions_by_file is not unset
        assert self._gt_by_file is not unset

        # Regions and ground truth are should not normally overlap.
        # Keep all DS regions regardless and only warn if overlaps are found.
        gt_spans_by_file: dict[str, list[tuple[float, float]]] = {}
        for filename, gt_regions in self._gt_by_file.items():
            gt_spans_by_file[filename] = [
                (gt.start.total_seconds(), gt.stop.total_seconds()) for gt in gt_regions
            ]

        ds_regions: list[PresentedRegion] = []
        overlap_count = 0
        for filename in sorted(self._regions_by_file):
            gt_spans = gt_spans_by_file.get(filename, [])
            rows = sorted(self._regions_by_file[filename], key=lambda r: r.start)
            overlap_count += sum(
                any(
                    _overlaps(r.start.total_seconds(), r.stop.total_seconds(), gs, ge)
                    for gs, ge in gt_spans
                )
                for r in rows
            )
            bundled = _bundle_regions(
                rows,
                min_duration=self.spec.details.roi_min_duration.total_seconds(),
                max_duration=self.spec.details.roi_max_duration.total_seconds(),
            )
            for start, stop, members in bundled:
                ds_regions.append(
                    PresentedRegion(
                        source_filename=filename,
                        start=start,
                        stop=stop,
                        kind=RegionKind.ds,
                        input_ids=[m.id for m in members],
                    )
                )

        if overlap_count:
            self.logger.warning(
                f"{overlap_count} input region(s) overlap ground-truth regions; "
                "regions and ground truth are expected to be disjoint."
            )

        self._ds_regions = ds_regions

    # -- assignments ------------------------------------------------------- #

    def _prepare_assignments(self) -> None:
        assert self._ds_regions is not unset
        assert self._honeypots is not unset
        assert self._media_dir is not unset
        assert self._media_paths is not unset

        region_lists = plan_assignments(
            self._ds_regions,
            self._honeypots,
            composition=self.spec.details.min_composition,
            validation_overhead=self.spec.details.validation_overhead,
            max_audio_duration=self.spec.details.standard_assignment_duration.total_seconds(),
            random_seed=self.spec.details.random_seed,
        )
        if not region_lists:
            raise DatasetValidationError(
                "No assignments could be formed from the provided regions and ground truth"
            )

        pause = self.spec.details.roi_join_pause
        pause_ms = round(pause.total_seconds() * 1000)
        assignments: list[Assignment] = []
        for regions in region_lists:
            assignment_id = uuid.uuid4().hex
            clip_filename = f"{assignment_id}.wav"
            clip_path = self._media_dir / clip_filename

            cuts = [
                RegionCut(media=self._media_paths[r.source_filename], start=r.start, stop=r.stop)
                for r in regions
            ]
            cut_and_concat(
                cuts, clip_path, pause_ms=pause_ms, sample_rate=self.spec.details.sample_rate
            )

            placed, clip_duration = place_regions(regions, pause_s=pause.total_seconds())
            assignments.append(
                Assignment(
                    id=assignment_id,
                    clip_filename=clip_filename,
                    clip_duration=clip_duration,
                    placed=placed,
                )
            )
        self._assignments = assignments

    # -- persistence ------------------------------------------------------- #

    def _upload_clips_and_meta(self) -> None:
        assert self._assignments is not unset
        assert self._media_dir is not unset
        assert self._media_paths is not unset
        assert self._ds_regions is not unset
        assert self._honeypots is not unset
        assert self._regions_tsv_data is not unset
        assert self._gt_tsv_data is not unset

        storage_client = self._make_cloud_storage_client(self._oracle_data_bucket)

        for assignment in self._assignments:
            clip_path = self._media_dir / assignment.clip_filename
            storage_client.create_file(
                compose_data_bucket_filename(
                    self.escrow_address,
                    self.chain_id,
                    f"{self._meta_layout.CLIPS_DIR}/{assignment.clip_filename}",
                ),
                clip_path.read_bytes(),
            )

        # copies of the raw inputs, for provenance / downstream scoring
        storage_client.create_file(
            compose_data_bucket_filename(
                self.escrow_address, self.chain_id, self._meta_layout.REGIONS_TSV_FILENAME
            ),
            self._regions_tsv_data,
        )
        storage_client.create_file(
            compose_data_bucket_filename(
                self.escrow_address, self.chain_id, self._meta_layout.GT_FILENAME
            ),
            self._gt_tsv_data,
        )

        pool = list(self._ds_regions) + list(self._honeypots)
        storage_client.create_file(
            compose_data_bucket_filename(
                self.escrow_address, self.chain_id, self._meta_layout.REGIONS_FILENAME
            ),
            self._meta_serializer.serialize_regions(pool),
        )
        storage_client.create_file(
            compose_data_bucket_filename(
                self.escrow_address, self.chain_id, self._meta_layout.ASSIGNMENTS_FILENAME
            ),
            self._meta_serializer.serialize_assignments(self._assignments),
        )

        if Config.debug:
            self._upload_roi_cuts(storage_client)

    def _upload_roi_cuts(self, storage_client) -> None:
        assert self._media_dir is not unset
        assert self._media_paths is not unset
        assert self._ds_regions is not unset
        assert self._honeypots is not unset

        pairs = (
            (self._meta_layout.DS_CUTS_DIR, self._ds_regions),
            (self._meta_layout.GT_CUTS_DIR, self._honeypots),
        )
        for subdir, regions in pairs:
            for i, region in enumerate(regions):
                stem = PurePosixPath(region.source_filename).stem
                cut_name = f"{i:04d}_{stem}_{region.start:.2f}-{region.stop:.2f}.wav"
                cut_path = self._media_dir / cut_name
                cut_and_concat(
                    [
                        RegionCut(
                            media=self._media_paths[region.source_filename],
                            start=region.start,
                            stop=region.stop,
                        )
                    ],
                    cut_path,
                    pause_ms=0,
                    sample_rate=self.spec.details.sample_rate,
                )
                storage_client.create_file(
                    compose_data_bucket_filename(
                        self.escrow_address, self.chain_id, f"{subdir}/{cut_name}"
                    ),
                    cut_path.read_bytes(),
                )

    # -- CVAT + DB --------------------------------------------------------- #

    def _create_on_cvat(self) -> None:
        assert self._assignments is not unset

        escrow_address = self.escrow_address
        chain_id = self.chain_id

        label_configuration = _make_cvat_audio_label_configuration(
            self.spec.labels,
            transcription_attr_name=self.spec.details.transcription_attr_name,
            shared_attributes=self.spec.shared_attributes,
        )

        cvat_project = cvat_api.create_project(
            escrow_address, labels=label_configuration, user_guide=self.spec.user_guide
        )
        cvat_webhook = cvat_api.create_cvat_webhook(cvat_project.id)
        cloud_storage = cvat_api.create_cloudstorage(
            **make_cvat_cloud_storage_params(self._oracle_data_bucket)
        )

        with SessionLocal.begin() as session:
            self.logger.info(
                "Task creation for escrow '%s': will create %s assignments",
                escrow_address,
                len(self._assignments),
            )
            db_service.create_escrow_creation(
                session,
                escrow_address=escrow_address,
                chain_id=chain_id,
                total_jobs=len(self._assignments),
            )

            project_id = db_service.create_project(
                session,
                cvat_project.id,
                cloud_storage.id,
                TaskTypes.audio_transcription,
                escrow_address,
                chain_id,
                self._oracle_data_bucket.to_url(),
                cvat_webhook_id=cvat_webhook.id,
            )
            db_service.get_project_by_id(session, project_id, for_update=True)  # lock the row

            for assignment in self._assignments:
                clip_key = compose_data_bucket_filename(
                    escrow_address,
                    chain_id,
                    f"{self._meta_layout.CLIPS_DIR}/{assignment.clip_filename}",
                )
                cvat_task = cvat_api.create_task(cvat_project.id, escrow_address)
                task_id = db_service.create_task(
                    session, cvat_task.id, cvat_project.id, TaskStatuses[cvat_task.status]
                )
                db_service.get_task_by_id(session, task_id, for_update=True)  # lock the row

                cvat_api.put_task_data(cvat_task.id, cloud_storage.id, filenames=[clip_key])
                db_service.create_data_upload(session, cvat_task.id)

            db_service.touch(session, Project, [project_id])

    # -- orchestration ----------------------------------------------------- #

    def build(self) -> None:
        self._download_input_data()

        self._prepare_rois()
        self._prepare_assignments()

        self._upload_clips_and_meta()
        self._create_on_cvat()


# --------------------------------------------------------------------------- #
# TSV parsing
# --------------------------------------------------------------------------- #


def _read_tsv(data: bytes) -> list[dict[str, str]]:
    reader = csv.DictReader(io.StringIO(data.decode("utf-8")), delimiter="\t")
    return list(reader)


def _parse_regions_tsv(data: bytes) -> dict[str, list[InputRegion]]:
    by_file: dict[str, list[InputRegion]] = {}
    for row_idx, row in enumerate(_read_tsv(data)):
        filename = row["filename"].strip()
        by_file.setdefault(filename, []).append(
            InputRegion(
                filename=filename,
                row_idx=row_idx,
                start=parse_time(row["start"]),
                stop=parse_time(row["stop"]),
                label=(row.get("label") or "").strip() or None,
            )
        )
    return by_file


def _parse_gt_tsv(data: bytes) -> dict[str, list[InputGtRegion]]:
    by_file: dict[str, list[InputGtRegion]] = {}
    for row_idx, row in enumerate(_read_tsv(data)):
        filename = row["filename"].strip()
        by_file.setdefault(filename, []).append(
            InputGtRegion(
                filename=filename,
                row_idx=row_idx,
                start=parse_time(row["start"]),
                stop=parse_time(row["stop"]),
                label=(row.get("label") or "").strip() or None,
                text=(row.get("text") or "").strip(),
            )
        )
    return by_file


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def _validate_gt_regions(
    regions: list[InputGtRegion],
    filename: str,
    file_duration: float,
    max_duration: float,
    excluded: ExcludedAnnotationsInfo,
) -> list[InputGtRegion]:
    valid: list[InputGtRegion] = []
    for region in regions:
        start = region.start.total_seconds()
        stop = region.stop.total_seconds()

        excluded.total_count += 1

        if not (0 <= start < stop <= file_duration + 1e-6):
            excluded.excluded_count += 1
            excluded.add_message(
                f"GT region '{region.row_idx}' ({region.label}) [{start:.3f}, {stop:.3f}] "
                "- invalid timestamps",
                sample_id=filename,
                sample_subset="",
            )
            continue

        if stop - start > max_duration:
            excluded.excluded_count += 1
            excluded.add_message(
                f"GT region '{region.row_idx}' ({region.label}) [{start:.3f}, {stop:.3f}] "
                f"- longer than the maximum region duration ({max_duration:.3f}s)",
                sample_id=filename,
                sample_subset="",
            )
            continue

        valid.append(region)

    return valid


def _bucket_key(prefix: str, filename: str) -> str:
    """Join a bucket prefix and a filename into a POSIX-style object key."""
    return str(PurePosixPath(prefix, filename))

def _make_cvat_audio_label_configuration(
    labels: list[str],
    *,
    transcription_attr_name: str,
    shared_attributes: list | None = None,
) -> list[dict]:
    """Interval labels (one per speaker) each carrying a mutable transcription text attribute,
    plus any shared attributes. Used for audio_transcription tasks."""
    shared_attributes = shared_attributes or []

    def _shared_attr_spec(attr) -> dict:
        return {
            "name": attr.name,
            "mutable": True,
            "input_type": attr.type or "text",
            "values": list(attr.values),
            "default_value": attr.default_value,
        }

    label_config = []
    for name in labels:
        attributes = [
            {
                "name": transcription_attr_name,
                "mutable": True,
                "input_type": "text",
                "values": [],
                "default_value": "",
            },
            *(_shared_attr_spec(a) for a in shared_attributes),
        ]
        label_config.append(
            {
                "name": name,
                "type": cvat_api.LabelType.interval.value,
                "attributes": attributes,
            }
        )
    return label_config
