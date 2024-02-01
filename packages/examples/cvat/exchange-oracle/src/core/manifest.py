from decimal import Decimal
from enum import Enum
from typing import Annotated, List, Literal, Optional, Tuple, Union

from pydantic import AnyUrl, BaseModel, Field, root_validator

from src.core.config import Config
from src.core.types import TaskType
from src.utils.enums import BetterEnumMeta


class DataInfo(BaseModel):
    data_url: AnyUrl
    "Bucket URL, s3 only, virtual-hosted-style access"
    # https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-bucket-intro.html

    points_url: Optional[AnyUrl] = None
    "A path to an archive with a set of points in COCO Keypoints format, "
    "which provides information about all objects on images"

    boxes_url: Optional[AnyUrl] = None
    "A path to an archive with a set of boxes in COCO Instances format, "
    "which provides information about all objects on images"


class LabelType(str, Enum, metaclass=BetterEnumMeta):
    plain = "plain"
    skeleton = "skeleton"


class LabelInfo(BaseModel):
    name: str
    # https://opencv.github.io/cvat/docs/api_sdk/sdk/reference/models/label/

    type: LabelType = LabelType.plain


class PlainLabelInfo(LabelInfo):
    type: Literal[LabelType.plain]


class SkeletonLabelInfo(LabelInfo):
    type: Literal[LabelType.skeleton]

    nodes: List[str] = Field(min_items=1)
    """
    A list of node label names (only points are supposed to be nodes).
    Example:
    [
        "left hand", "torso", "right hand", "head"
    ]
    """

    joints: List[Tuple[int, int]]
    "A list of node adjacency, e.g. [[0, 1], [1, 2], [1, 3]]"

    @root_validator
    @classmethod
    def validate_type(cls, values: dict) -> dict:
        if values["type"] != LabelType.skeleton:
            raise ValueError(f"Label type must be {LabelType.skeleton}")

        # TODO: validate label names (empty strings, repeats)

        skeleton_name = values["name"]
        nodes_count = len(values["nodes"])
        joints = values["joints"]
        for joint_idx, joint in enumerate(joints):
            for v in joint:
                if not (0 <= v < nodes_count):
                    raise ValueError(
                        f"Skeleton '{skeleton_name}' joint #{joint_idx}: invalid value. "
                        f"Expected a number in the range [0; {nodes_count - 1}]"
                    )

        return values


_Label = Annotated[Union[PlainLabelInfo, SkeletonLabelInfo], Field(discriminator="type")]


class AnnotationInfo(BaseModel):
    type: TaskType

    labels: list[_Label]
    "Label declarations with accepted annotation types"

    description: str = ""
    "Brief task description"

    user_guide: str = ""
    "User guide in markdown format"

    job_size: int = 10
    "Frames per job, validation frames are not included"

    max_time: int = Field(default_factory=lambda: Config.core_config.default_assignment_time)
    "Maximum time per job (assignment) for an annotator, in seconds"


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


def parse_manifest(manifest: dict) -> TaskManifest:
    # Add default value for labels, if none provided.
    # pydantic can't do this for tagged unions

    try:
        labels = manifest["annotation"]["labels"]
        for label_info in labels:
            label_info["type"] = label_info.get("type", LabelType.plain)
    except KeyError:
        pass

    return TaskManifest.parse_obj(manifest)
