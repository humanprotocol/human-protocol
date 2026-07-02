from enum import Enum
from typing import Any, Literal

from pydantic import AnyUrl, BaseModel, ConfigDict, Field, model_validator

from src.core.manifest.shared import BucketUrl, LabelInfo, LabelTypes
from src.core.types import TaskTypes
from src.utils.enums import BetterEnumMeta


class DataInfo(BaseModel):
    media_url: AnyUrl | BucketUrl
    "Bucket URL, AWS S3 | GCS, virtual-hosted-style access"

    gt_url: AnyUrl | BucketUrl
    "URL to the archive with Ground Truth annotations"

    points_url: AnyUrl | BucketUrl | None = None
    """
    A path to a file or an archive with a set of points in COCO Keypoints format.
    Applicable for: image_boxes_from_points
    """

    boxes_url: AnyUrl | BucketUrl | None = None
    """
    A path to a file or an archive with a set of boxes in COCO Instances format.
    Applicable for: image_skeletons_from_boxes
    """

    regions_url: AnyUrl | BucketUrl | None = None
    """
    A path to a file or an archive with audio regions in the CVAT Generic TSV format.
    Applicable for: audio_transcription
    """


class TargetMetrics(str, Enum, metaclass=BetterEnumMeta):
    accuracy = "accuracy"
    wer = "wer"
    cer = "cer"


class ValidationInfo(BaseModel):
    target_score: float = Field(ge=0)
    "Required annotation score. Can be minimal or maximal depending on the metric used"

    target_metric: TargetMetrics = TargetMetrics.accuracy
    "Metric used to score annotations against the target"


class MinComposition(BaseModel):
    gt: int
    "Minimal number of Ground Truth samples per composition"

    ds: int
    "Minimal number of dataset samples per composition"


class DetailsInfoBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_time: int | None = None
    "Maximum assignment time, seconds"


class ImageJobDetails(DetailsInfoBase):
    job_size: int | None = None
    "Frames per job, validation frames are not included"

    val_size: int | None = None
    "Validation frames per job"


class AudioJobDetails(DetailsInfoBase):
    normalizer: str | None = "basic"
    "Text normalizer for audio transcription"

    max_segment_duration: int | None = None
    "Maximum audio segment duration, seconds"

    min_composition: MinComposition | None = None
    "Minimal composition of a job"

    validation_overhead: int | None = None
    "Extra validation samples added on top of the required amount"


DetailsInfo = ImageJobDetails | AudioJobDetails


class SharedAttribute(BaseModel):
    name: str = Field(min_length=1)
    type: str
    values: list[str] = Field(default_factory=list)
    default_value: str = ""


class AnnotationInfo(BaseModel):
    description: str = ""
    "Brief task description"

    user_guide_url: str = ""
    "URL to the user guide in markdown format"

    labels: list[LabelInfo] = Field(min_length=1)
    "Label declarations with accepted annotation types"

    shared_attributes: list[SharedAttribute] = Field(default_factory=list)
    "Shared annotation attributes"

    validation: ValidationInfo

    qualifications: list[str] = Field(default_factory=list)
    "A list of annotator qualifications required for participation"

    details: ImageJobDetails | AudioJobDetails | None = None
    "Task-specific details"

    @model_validator(mode="before")
    @classmethod
    def validate_label_type(cls, values: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(values, dict):
            raise NotImplementedError

        default_label_type = LabelTypes.plain
        if values["type"] == TaskTypes.image_skeletons_from_boxes:
            default_label_type = LabelTypes.skeleton

        # Add default value for labels, if none provided.
        # pydantic can't do this for tagged unions
        try:
            labels = values["labels"]
            for label_info in labels:
                label_info["type"] = label_info.get("type", default_label_type)
        except KeyError:
            pass

        return values


class JobManifest(BaseModel):
    version: Literal[2]

    task_type: TaskTypes
    data: DataInfo
    annotation: AnnotationInfo

    @model_validator(mode="before")
    @classmethod
    def validate_task_details(cls, values: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(values, dict):
            raise NotImplementedError

        annotation = values.get("annotation")
        if not isinstance(annotation, dict):
            raise NotImplementedError

        if details := annotation.get("details"):
            if not isinstance(details, dict):
                raise NotImplementedError

            details_cls = (
                AudioJobDetails
                if values.get("job_type") == TaskTypes.audio_transcription
                else ImageJobDetails
            )
            annotation["details"] = details_cls.model_validate(details)

        return values
