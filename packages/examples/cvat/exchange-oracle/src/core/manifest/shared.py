from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, model_validator

from src.utils.enums import BetterEnumMeta, StrEnum


class BucketProviders(StrEnum):
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
    service_account_key: dict[str, Any] = {}  # (optional) Contents of GCS key file


BucketUrl = Annotated[AwsBucketUrl | GcsBucketUrl, Field(discriminator="provider")]


class LabelTypes(StrEnum, metaclass=BetterEnumMeta):
    plain = "plain"
    skeleton = "skeleton"


class LabelInfoBase(BaseModel):
    name: str = Field(min_length=1)
    # https://docs.cvat.ai/docs/api_sdk/sdk/reference/models/label/

    type: LabelTypes = LabelTypes.plain


class PlainLabelInfo(LabelInfoBase):
    type: Literal[LabelTypes.plain]


class SkeletonLabelInfo(LabelInfoBase):
    type: Literal[LabelTypes.skeleton]

    nodes: list[str] = Field(min_length=1)
    """
    A list of node label names (only points are supposed to be nodes).
    Example:
    [
        "left hand", "torso", "right hand", "head"
    ]
    """

    joints: list[tuple[int, int]] | None = Field(default_factory=list)
    "A list of node adjacency, e.g. [[0, 1], [1, 2], [1, 3]]"

    @model_validator(mode="before")
    @classmethod
    def validate_type(cls, values: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(values, dict):
            raise NotImplementedError

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
        joints = values.get("joints")
        if joints is not None:
            for joint_idx, joint in enumerate(joints):
                for v in joint:
                    if not (0 <= v < nodes_count):
                        raise ValueError(
                            f"Skeleton '{skeleton_name}' joint #{joint_idx}: invalid value. "
                            f"Expected a number in the range [0; {nodes_count - 1}]"
                        )

        return values


LabelInfo = Annotated[PlainLabelInfo | SkeletonLabelInfo, Field(discriminator="type")]
