from decimal import Decimal
from enum import Enum
from typing import Annotated, Any, Dict, List, Literal, Optional, Tuple, Union

from pydantic import AnyUrl, BaseModel, Field, root_validator

from src.core.types import TaskTypes
from src.utils.enums import BetterEnumMeta


class BucketProviders(str, Enum):
    aws = "AWS"
    gcs = "GCS"


class BucketUrlBase(BaseModel):
    provider: BucketProviders
    host_url: str
    bucket_name: str
    path: str = ""


class AwsBucketUrl(BucketUrlBase, BaseModel):
    provider: Literal[BucketProviders.aws]
    access_key: str = ""  # (optional) AWS Access key
    secret_key: str = ""  # (optional) AWS Secret key


class GcsBucketUrl(BucketUrlBase, BaseModel):
    provider: Literal[BucketProviders.gcs]
    service_account_key: Dict[str, Any] = {}  # (optional) Contents of GCS key file


BucketUrl = Annotated[Union[AwsBucketUrl, GcsBucketUrl], Field(discriminator="provider")]


class DataInfo(BaseModel):
    data_url: Union[AnyUrl, BucketUrl]
    "Bucket URL, AWS S3 | GCS, virtual-hosted-style access"
    # https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-bucket-intro.html

    points_url: Optional[Union[AnyUrl, BucketUrl]] = None
    "A path to an archive with a set of points in COCO Keypoints format, "
    "which provides information about all objects on images"

    boxes_url: Optional[Union[AnyUrl, BucketUrl]] = None
    "A path to an archive with a set of boxes in COCO Instances format, "
    "which provides information about all objects on images"


class LabelTypes(str, Enum, metaclass=BetterEnumMeta):
    plain = "plain"
    skeleton = "skeleton"


class LabelInfoBase(BaseModel):
    name: str = Field(min_length=1)
    # https://opencv.github.io/cvat/docs/api_sdk/sdk/reference/models/label/

    type: LabelTypes = LabelTypes.plain


class PlainLabelInfo(LabelInfoBase):
    type: Literal[LabelTypes.plain]


class SkeletonLabelInfo(LabelInfoBase):
    type: Literal[LabelTypes.skeleton]

    nodes: List[str] = Field(min_length=1)
    """
    A list of node label names (only points are supposed to be nodes).
    Example:
    [
        "left hand", "torso", "right hand", "head"
    ]
    """

    joints: Optional[List[Tuple[int, int]]] = Field(default_factory=list)
    "A list of node adjacency, e.g. [[0, 1], [1, 2], [1, 3]]"

    @root_validator
    @classmethod
    def validate_type(cls, values: dict) -> dict:
        if values["type"] != LabelTypes.skeleton:
            raise ValueError(f"Label type must be {LabelTypes.skeleton}")

        skeleton_name = values["name"]

        existing_names = set()
        for node_name in values["nodes"]:
            node_name = node_name.strip()

            if not node_name:
                raise ValueError(f"Skeleton '{skeleton_name}': point name is empty")

            if node_name.lower() in existing_names:
                raise ValueError(
                    f"Skeleton '{skeleton_name}' point {node_name}: label is duplicated"
                )

            existing_names.add(node_name.lower())

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


LabelInfo = Annotated[Union[PlainLabelInfo, SkeletonLabelInfo], Field(discriminator="type")]


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

    max_time: Optional[int] = None  # deprecated, TODO: mark deprecated with pydantic 2.7+
    "Maximum time per job (assignment) for an annotator, in seconds"

    @root_validator(pre=True)
    @classmethod
    def _validate_label_type(cls, values: dict[str, Any]) -> dict[str, Any]:
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

    gt_url: Union[AnyUrl, BucketUrl]
    "URL to the archive with Ground Truth annotations, the format is COCO keypoints"


class TaskManifest(BaseModel):
    data: DataInfo
    annotation: AnnotationInfo
    validation: ValidationInfo

    job_bounty: Decimal = Field(ge=0)
    "Assignment bounty, a decimal value in HMT"


def parse_manifest(manifest: Any) -> TaskManifest:
    return TaskManifest.parse_obj(manifest)
