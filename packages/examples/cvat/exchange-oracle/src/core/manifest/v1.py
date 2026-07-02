from decimal import Decimal
from typing import Any, Literal

from pydantic import AnyUrl, BaseModel, Field, model_validator

from src.core.manifest.shared import BucketUrl, LabelInfo, LabelTypes
from src.core.types import TaskTypes


class DataInfo(BaseModel):
    data_url: AnyUrl | BucketUrl
    "Bucket URL, AWS S3 | GCS, virtual-hosted-style access"
    # https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-bucket-intro.html

    points_url: AnyUrl | BucketUrl | None = None
    "A path to an archive with a set of points in COCO Keypoints format, "
    "which provides information about all objects on images"

    boxes_url: AnyUrl | BucketUrl | None = None
    "A path to an archive with a set of boxes in COCO Instances format, "
    "which provides information about all objects on images"


class AnnotationInfo(BaseModel):
    type: TaskTypes

    labels: list[LabelInfo] = Field(min_length=1)
    "Label declarations with accepted annotation types"

    description: str = ""
    "Brief task description"

    user_guide: str = ""
    "User guide in markdown format"

    job_size: int = 10
    "Frames per job, validation frames are not included"

    qualifications: list[str] = Field(default_factory=list)
    "A list of annotator qualifications required for participation"

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


class ValidationInfo(BaseModel):
    min_quality: float = Field(ge=0)
    "Minimal accepted annotation accuracy"

    val_size: int = Field(default=2, gt=0)
    "Validation frames per job"

    gt_url: AnyUrl | BucketUrl
    "URL to the archive with Ground Truth annotations, the format is COCO keypoints"


class JobManifest(BaseModel):
    version: Literal[1] = 1

    data: DataInfo
    annotation: AnnotationInfo
    validation: ValidationInfo

    job_bounty: Decimal = Field(ge=0)
    "Assignment bounty, a decimal value in HMT"
