import os
from pathlib import Path
from tempfile import TemporaryDirectory

import datumaro as dm

# These details are relevant for image_points tasks


class TaskMetaLayout:
    GT_FILENAME = "gt.json"


class TaskMetaSerializer:
    GT_DATASET_FORMAT = "datumaro"

    def serialize_gt_annotations(self, gt_dataset: dm.Dataset) -> bytes:
        with TemporaryDirectory() as temp_dir:
            gt_dataset_dir = os.path.join(temp_dir, "gt_dataset")
            gt_dataset.export(gt_dataset_dir, self.GT_DATASET_FORMAT)
            return (Path(gt_dataset_dir) / "annotations" / "default.json").read_bytes()

    def parse_gt_annotations(self, gt_dataset_data: bytes) -> dm.Dataset:
        with TemporaryDirectory() as temp_dir:
            annotations_dir = os.path.join(temp_dir, "annotations")
            Path(annotations_dir).mkdir()

            annotations_filename = os.path.join(annotations_dir, "default.json")
            with open(annotations_filename, "wb") as f:
                f.write(gt_dataset_data)

            dataset = dm.Dataset.import_from(temp_dir, format=self.GT_DATASET_FORMAT)
            dataset.init_cache()
            return dataset
