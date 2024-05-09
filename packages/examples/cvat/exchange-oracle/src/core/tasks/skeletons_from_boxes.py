import os
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Dict, Sequence, Tuple

import attrs
import datumaro as dm
from attrs import frozen
from datumaro.util import dump_json, parse_json

from src.core.config import Config

DEFAULT_ASSIGNMENT_SIZE_MULTIPLIER = Config.core_config.skeleton_assignment_size_mult

SkeletonBboxMapping = Dict[int, int]


@frozen(kw_only=True)
class RoiInfo:
    original_image_key: int
    bbox_id: int
    bbox_x: int
    bbox_y: int
    bbox_label: int

    # RoI is centered on the bbox center
    # Coordinates can be out of image boundaries.
    # In this case RoI includes extra margins to be centered on bbox center
    roi_x: int
    roi_y: int
    roi_w: int
    roi_h: int

    def asdict(self) -> dict:
        return attrs.asdict(self, recurse=False)


RoiInfos = Sequence[RoiInfo]

RoiFilenames = Dict[int, str]

PointLabelsMapping = Dict[Tuple[str, str], str]
"(skeleton, point) -> job point name"


class TaskMetaLayout:
    GT_FILENAME = "gt.json"
    BOXES_FILENAME = "boxes.json"
    POINT_LABELS_FILENAME = "point_labels.json"
    SKELETON_BBOX_MAPPING_FILENAME = "skeleton_bbox_mapping.json"
    ROI_INFO_FILENAME = "rois.json"

    ROI_FILENAMES_FILENAME = "roi_filenames.json"
    # this is separated from the general roi info to make name mangling more "optional"


class TaskMetaSerializer:
    GT_DATASET_FORMAT = "coco_person_keypoints"
    BBOX_DATASET_FORMAT = "coco_instances"

    def serialize_gt_annotations(self, gt_dataset: dm.Dataset) -> bytes:
        with TemporaryDirectory() as temp_dir:
            gt_dataset_dir = os.path.join(temp_dir, "gt_dataset")
            gt_dataset.export(gt_dataset_dir, self.GT_DATASET_FORMAT)
            return (
                Path(gt_dataset_dir) / "annotations" / "person_keypoints_default.json"
            ).read_bytes()

    def serialize_bbox_annotations(self, bbox_dataset: dm.Dataset) -> bytes:
        with TemporaryDirectory() as temp_dir:
            bbox_dataset_dir = os.path.join(temp_dir, "bbox_dataset")
            bbox_dataset.export(bbox_dataset_dir, self.BBOX_DATASET_FORMAT)
            return (Path(bbox_dataset_dir) / "annotations" / "instances_default.json").read_bytes()

    def serialize_skeleton_bbox_mapping(self, skeleton_bbox_mapping: SkeletonBboxMapping) -> bytes:
        return dump_json({str(k): str(v) for k, v in skeleton_bbox_mapping.items()})

    def serialize_roi_info(self, rois_info: RoiInfos) -> bytes:
        return dump_json([roi_info.asdict() for roi_info in rois_info])

    def serialize_roi_filenames(self, roi_filenames: RoiFilenames) -> bytes:
        return dump_json({str(k): v for k, v in roi_filenames.items()})

    def serialize_point_labels(self, point_labels: PointLabelsMapping) -> bytes:
        return dump_json(
            [
                {
                    "skeleton_label": k[0],
                    "point_label": k[1],
                    "job_point_label": v,
                }
                for k, v in point_labels.items()
            ]
        )

    def parse_gt_annotations(self, gt_dataset_data: bytes) -> dm.Dataset:
        with TemporaryDirectory() as temp_dir:
            annotations_filename = os.path.join(temp_dir, "annotations.json")
            with open(annotations_filename, "wb") as f:
                f.write(gt_dataset_data)

            dataset = dm.Dataset.import_from(annotations_filename, format=self.GT_DATASET_FORMAT)
            dataset.init_cache()
            return dataset

    def parse_bbox_annotations(self, bbox_dataset_data: bytes) -> dm.Dataset:
        with TemporaryDirectory() as temp_dir:
            annotations_filename = os.path.join(temp_dir, "annotations.json")
            with open(annotations_filename, "wb") as f:
                f.write(bbox_dataset_data)

            dataset = dm.Dataset.import_from(annotations_filename, format=self.BBOX_DATASET_FORMAT)
            dataset.init_cache()
            return dataset

    def parse_skeleton_bbox_mapping(self, skeleton_bbox_mapping_data: bytes) -> SkeletonBboxMapping:
        return {int(k): int(v) for k, v in parse_json(skeleton_bbox_mapping_data).items()}

    def parse_roi_info(self, rois_info_data: bytes) -> RoiInfos:
        return [RoiInfo(**roi_info) for roi_info in parse_json(rois_info_data)]

    def parse_roi_filenames(self, roi_filenames_data: bytes) -> RoiFilenames:
        return {int(k): v for k, v in parse_json(roi_filenames_data).items()}

    def parse_point_labels(self, point_labels_data: bytes) -> PointLabelsMapping:
        return {
            (v["skeleton_label"], v["point_label"]): v["job_point_label"]
            for v in parse_json(point_labels_data)
        }
