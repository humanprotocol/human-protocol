import os
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Sequence

import attrs
import datumaro as dm
from attrs import frozen
from datumaro.util import dump_json, parse_json

BboxPointMapping = dict[int, int]


@frozen
class RoiInfo:
    point_id: int
    original_image_key: int
    point_x: int
    point_y: int
    roi_x: int
    roi_y: int
    roi_w: int
    roi_h: int

    def asdict(self) -> dict:
        return attrs.asdict(self, recurse=False)


RoiInfos = Sequence[RoiInfo]

RoiFilenames = dict[int, str]


class TaskMetaLayout:
    GT_FILENAME = "gt.json"
    POINTS_FILENAME = "points.json"
    BBOX_POINT_MAPPING_FILENAME = "bbox_point_mapping.json"
    ROI_INFO_FILENAME = "rois.json"

    ROI_FILENAMES_FILENAME = "roi_filenames.json"
    # this is separated from the general roi info to make name mangling more "optional"


class TaskMetaSerializer:
    GT_DATASET_FORMAT = "coco_instances"
    POINTS_DATASET_FORMAT = "coco_person_keypoints"

    def serialize_gt_annotations(self, gt_dataset: dm.Dataset) -> bytes:
        with TemporaryDirectory() as temp_dir:
            gt_dataset_dir = os.path.join(temp_dir, "gt_dataset")
            gt_dataset.export(gt_dataset_dir, self.GT_DATASET_FORMAT)
            return (Path(gt_dataset_dir) / "annotations" / "instances_default.json").read_bytes()

    def serialize_bbox_point_mapping(self, bbox_point_mapping: BboxPointMapping) -> bytes:
        return dump_json({str(k): str(v) for k, v in bbox_point_mapping.items()})

    def serialize_roi_info(self, rois_info: RoiInfos) -> bytes:
        return dump_json([roi_info.asdict() for roi_info in rois_info])

    def serialize_roi_filenames(self, roi_filenames: RoiFilenames) -> bytes:
        return dump_json({str(k): v for k, v in roi_filenames.items()})

    def parse_gt_annotations(self, gt_dataset_data: bytes) -> dm.Dataset:
        with TemporaryDirectory() as temp_dir:
            annotations_filename = os.path.join(temp_dir, "annotations.json")
            with open(annotations_filename, "wb") as f:
                f.write(gt_dataset_data)

            dataset = dm.Dataset.import_from(annotations_filename, format=self.GT_DATASET_FORMAT)
            dataset.init_cache()
            return dataset

    def parse_points_annotations(self, points_dataset_data: bytes) -> dm.Dataset:
        with TemporaryDirectory() as temp_dir:
            annotations_filename = os.path.join(temp_dir, "annotations.json")
            with open(annotations_filename, "wb") as f:
                f.write(points_dataset_data)

            dataset = dm.Dataset.import_from(
                annotations_filename, format=self.POINTS_DATASET_FORMAT
            )
            dataset.init_cache()
            return dataset

    def parse_bbox_point_mapping(self, bbox_point_mapping_data: bytes) -> BboxPointMapping:
        return {int(k): int(v) for k, v in parse_json(bbox_point_mapping_data).items()}

    def parse_roi_info(self, rois_info_data: bytes) -> RoiInfos:
        return [RoiInfo(**roi_info) for roi_info in parse_json(rois_info_data)]

    def parse_roi_filenames(self, roi_filenames_data: bytes) -> RoiFilenames:
        return {int(k): v for k, v in parse_json(roi_filenames_data).items()}
