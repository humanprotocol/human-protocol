from decimal import Decimal
from typing import Optional

from pydantic import AnyUrl, BaseModel, Field, root_validator

from src.core.config import Config
from src.core.types import TaskType


class DataInfo(BaseModel):
    data_url: AnyUrl
    "Bucket URL, s3 only, virtual-hosted-style access"
    # https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-bucket-intro.html

    points_url: Optional[AnyUrl] = None
    "A path to an archive with a set of points in COCO Keypoints format, "
    "which provides information about all objects on images"


class LabelInfo(BaseModel):
    name: str
    # https://opencv.github.io/cvat/docs/api_sdk/sdk/reference/models/label/


class AnnotationInfo(BaseModel):
    type: TaskType

    labels: list[LabelInfo]
    "Label declarations with accepted annotation types"

    description: str = ""
    "Brief task description"

    user_guide: str = ""
    "User guide in markdown format"

    job_size: int = 10
    "Frames per job, validation frames are not included"

    max_time: int = Field(default_factory=lambda: Config.core_config.default_assignment_time)
    "Maximum time per job (assignment) for an annotator, in seconds"

    @root_validator
    @classmethod
    def validate_type(cls, values: dict) -> dict:
        if values["type"] == TaskType.image_label_binary:
            if len(values["labels"]) != 2:
                raise ValueError("Binary classification requires 2 labels")

        return values


class ValidationInfo(BaseModel):
    min_quality: float = Field(ge=0)
    "Minimal accepted annotation accuracy"

    val_size: int = Field(default=2, gt=0)
    "Validation frames per job"

    gt_url: AnyUrl
    "URL to the archive with Ground Truth annotations, the format is COCO keypoints"


class TaskManifest(BaseModel):
    data: DataInfo
    annotation: AnnotationInfo
    validation: ValidationInfo

    job_bounty: Decimal = Field(ge=0)
    "Assignment bounty, a decimal value in HMT"
