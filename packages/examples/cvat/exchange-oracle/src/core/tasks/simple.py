import os
from pathlib import Path
from tempfile import TemporaryDirectory

import datumaro as dm

# These details are relevant for IMAGE_POINTS and IMAGE_BOXES tasks


class TaskMetaLayout:
    GT_FILENAME = "gt.json"


class TaskMetaSerializer:
    GT_DATASET_FORMAT = "coco_instances"

    def serialize_gt_annotations(self, gt_dataset: dm.Dataset) -> bytes:
        with TemporaryDirectory() as temp_dir:
            gt_dataset_dir = os.path.join(temp_dir, "gt_dataset")
            gt_dataset.export(gt_dataset_dir, self.GT_DATASET_FORMAT)
            return (Path(gt_dataset_dir) / "annotations" / "instances_default.json").read_bytes()

    def parse_gt_annotations(self, gt_dataset_data: bytes) -> dm.Dataset:
        with TemporaryDirectory() as temp_dir:
            annotations_filename = os.path.join(temp_dir, "annotations.json")
            with open(annotations_filename, "wb") as f:
                f.write(gt_dataset_data)

            dataset = dm.Dataset.import_from(annotations_filename, format=self.GT_DATASET_FORMAT)
            dataset.init_cache()
            return dataset
