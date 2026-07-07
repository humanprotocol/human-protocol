from __future__ import annotations

from datetime import timedelta
from enum import Enum
from typing import TYPE_CHECKING

from pydantic import AnyUrl, BaseModel, Field

from src.core.manifest.shared import BucketUrl  # noqa: TC001  # runtime-needed by pydantic
from src.core.tasks.errors import UnsupportedManifestError
from src.utils.enums import BetterEnumMeta

if TYPE_CHECKING:
    from src.core.manifest.v2 import JobManifest


class NormalizerPreset(str, Enum, metaclass=BetterEnumMeta):
    basic = "basic"


class TranscriptionTaskData(BaseModel):
    media_url: AnyUrl | BucketUrl
    regions_url: AnyUrl | BucketUrl
    gt_url: AnyUrl | BucketUrl


class TranscriptionTaskValidation(BaseModel):
    target_metric: str
    target_score: float


class TranscriptionDetails(BaseModel):
    assignment_time_limit: timedelta | None = None
    "Maximum time to complete an assignment"

    validation_overhead: float = 0.2
    "Honeypot share of the assignment duration"

    normalizer: NormalizerPreset | None = NormalizerPreset.basic
    "Text normalization for transcriptions"

    min_composition: tuple[int, int] = (2, 2)
    "(gt, ds): minimum number of honeypot and DS regions per assignment"

    roi_min_duration: timedelta = timedelta(seconds=5)
    "Minimum presented region duration. Smaller segments are bundled together"

    roi_max_duration: timedelta = timedelta(seconds=120)
    "Maximum presented region duration. Used for input validation"

    roi_join_pause: timedelta = timedelta(milliseconds=700)
    "Silence inserted between concatenated regions in an assignment clip"

    standard_assignment_duration: timedelta = timedelta(seconds=60)
    "Target audio duration per assignment"

    # TODO: add honeypot rotation later
    # max_validation_gt: float = 0.05
    # "Maximum share of GT regions used as honeypots. The rest is used for honeypot rotation"

    max_discarded_gt: float = 0.5
    "Maximum share of GT regions that may be discarded before job creation fails"

    sample_rate: int = 48000
    "Sample rate of the generated assignment clips, Hz"

    transcription_attr_name: str = "transcription"
    "The name of the output attribute for transcriptions in CVAT tasks and annotations"

    random_seed: int = 0
    "Seed for deterministic honeypot selection and assignment mixing"


class TranscriptionTaskSpecification(BaseModel):
    data: TranscriptionTaskData

    labels: list[str]
    shared_attributes: list = Field(default_factory=list)
    user_guide: str = ""

    validation: TranscriptionTaskValidation

    details: TranscriptionDetails = Field(default_factory=TranscriptionDetails)


def parse_audio_manifest(manifest: JobManifest) -> TranscriptionTaskSpecification:
    """
    Produce the task specification from a manifest, encapsulating manifest-version differences.

    Only v2 manifests are supported.
    """

    version = getattr(manifest, "version", 1)
    if version != 2:
        raise UnsupportedManifestError(
            f"Audio transcription requires a v2 manifest, got version {version}"
        )

    annotation = manifest.annotation
    validation = annotation.validation
    manifest_details = annotation.details

    # Only pass the details fields the manifest provides; pydantic fills the rest with defaults
    # and coerces raw values (e.g. normalizer str -> NormalizerPreset).
    details_fields: dict = {}
    if manifest_details is not None:
        if manifest_details.max_segment_duration is not None:
            details_fields["roi_max_duration"] = timedelta(
                seconds=manifest_details.max_segment_duration
            )
        if manifest_details.validation_overhead is not None:
            details_fields["validation_overhead"] = manifest_details.validation_overhead / 100.0
        if manifest_details.min_composition is not None:
            details_fields["min_composition"] = (
                manifest_details.min_composition.gt,
                manifest_details.min_composition.ds,
            )
        details_fields["normalizer"] = manifest_details.normalizer
        if manifest_details.max_time is not None:
            details_fields["assignment_time_limit"] = timedelta(seconds=manifest_details.max_time)

    return TranscriptionTaskSpecification(
        data=TranscriptionTaskData(
            media_url=manifest.data.media_url,
            regions_url=manifest.data.regions_url,
            gt_url=manifest.data.gt_url,
        ),
        labels=[label.name for label in annotation.labels],
        shared_attributes=list(annotation.shared_attributes),
        user_guide=annotation.user_guide_url,
        validation=TranscriptionTaskValidation(
            target_metric=validation.target_metric.value,
            target_score=validation.target_score,
        ),
        details=TranscriptionDetails(**details_fields),
    )
