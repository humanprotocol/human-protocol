from __future__ import annotations

from src.core.tasks.types import TaskTypes

DM_DATASET_FORMAT_MAPPING = {
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_points: "coco_person_keypoints",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_polygons: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
}

DM_GT_DATASET_FORMAT_MAPPING = {
    # GT uses the same format both for boxes and points
    TaskTypes.image_label_binary: "cvat_images",
    TaskTypes.image_points: "coco_instances",
    TaskTypes.image_boxes: "coco_instances",
    TaskTypes.image_polygons: "coco_instances",
    TaskTypes.image_boxes_from_points: "coco_instances",
    TaskTypes.image_skeletons_from_boxes: "coco_person_keypoints",
}
