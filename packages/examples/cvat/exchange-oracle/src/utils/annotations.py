import os
from glob import glob
from typing import Dict, List, Sequence

import datumaro as dm
import numpy as np
from defusedxml import ElementTree as ET


def flatten_points(input_points: Sequence[dm.Points]) -> List[dm.Points]:
    results = []

    for pts in input_points:
        for point_idx in range(len(pts.points) // 2):
            point_x = pts.points[2 * point_idx + 0]
            point_y = pts.points[2 * point_idx + 1]
            results.append(dm.Points([point_x, point_y], label=pts.label))

    return results


def prepare_cvat_annotations_for_dm(dataset_root: str):
    """
    Fixes project/job annotations from CVAT exported in the CVAT format
    to make them readable by Datumaro.

    Datumaro doesn't support the 'meta/project' and 'meta/job' keys,
    but does support 'meta/task'. The key formats are the same,
    only the name is different. The key is needed to parse labels correctly.
    """

    for annotation_filename in glob(os.path.join(dataset_root, "**/*.xml"), recursive=True):
        with open(annotation_filename, "rb+") as f:
            doc = ET.parse(f)
            doc_root = doc.getroot()

            if doc_root.find("meta/project"):
                # put labels into each task, if needed
                # datumaro doesn't support /meta/project/ tag, but works with tasks,
                # which is nested in the meta/project/
                labels_element = doc_root.find("meta/project/labels")
                if not labels_element:
                    continue

                for task_element in doc_root.iterfind("meta/project/tasks/task"):
                    task_element.append(labels_element)
            elif job_meta := doc_root.find("meta/job"):
                # just rename the job into task for the same reasons
                job_meta.tag = "task"
            else:
                continue

            f.seek(0)
            f.truncate()
            doc.write(f, encoding="utf-8")


def convert_point_arrays_dataset_to_1_point_skeletons(
    dataset: dm.Dataset, labels: Sequence[str]
) -> dm.Dataset:
    """
    In the COCO Person Keypoints format, we can only represent points inside skeletons.
    The function converts annotations from points to skeletons in the dataset.
    """

    def _get_skeleton_label(original_label: str) -> str:
        return original_label + "_sk"

    new_label_cat = dm.LabelCategories.from_iterable(
        [_get_skeleton_label(label) for label in labels]
        + [(label, _get_skeleton_label(label)) for label in labels]
    )
    new_points_cat = dm.PointsCategories.from_iterable(
        (new_label_cat.find(_get_skeleton_label(label))[0], [label]) for label in labels
    )
    converted_dataset = dm.Dataset(
        categories={
            dm.AnnotationType.label: new_label_cat,
            dm.AnnotationType.points: new_points_cat,
        },
        media_type=dm.Image,
    )

    label_id_map: Dict[int, int] = {
        original_id: new_label_cat.find(label.name, parent=_get_skeleton_label(label.name))[0]
        for original_id, label in enumerate(dataset.categories()[dm.AnnotationType.label])
    }  # old id -> new id

    for sample in dataset:
        points = [a for a in sample.annotations if isinstance(a, dm.Points)]
        points = flatten_points(points)

        skeletons = [
            dm.Skeleton(
                [p.wrap(label=label_id_map[p.label])],
                label=new_label_cat.find(_get_skeleton_label(labels[p.label]))[0],
            )
            for p in points
        ]

        converted_dataset.put(sample.wrap(annotations=skeletons))

    return converted_dataset


def remove_duplicated_gt_frames(dataset: dm.Dataset, known_frames: Sequence[str]) -> dm.Dataset:
    """
    Removes unknown images from the dataset inplace.

    On project dataset export, CVAT will add GT frames, which repeat in multiple tasks,
    with a suffix. We don't need these frames in the resulting dataset,
    and we can safely remove them.
    """
    if not isinstance(known_frames, set):
        known_frames = set(known_frames)

    for sample in list(dataset):
        item_image_filename = sample.media.path

        if item_image_filename not in known_frames:
            dataset.remove(sample.id, sample.subset)

    return dataset


def shift_ann(
    ann: dm.Annotation, offset_x: float, offset_y: float, *, img_w: int, img_h: int
) -> dm.Annotation:
    "Shift annotation coordinates with clipping to the image size"

    if isinstance(ann, dm.Bbox):
        shifted_ann = ann.wrap(
            x=offset_x + ann.x,
            y=offset_y + ann.y,
        )
    elif isinstance(ann, dm.Points):
        shifted_ann = ann.wrap(
            points=np.clip(
                np.reshape(ann.points, (-1, 2)) + (offset_x, offset_y),
                0,
                [img_w, img_h],
            ).flat
        )
    elif isinstance(ann, dm.Skeleton):
        shifted_ann = ann.wrap(
            elements=[
                point.wrap(
                    points=np.clip(
                        np.reshape(point.points, (-1, 2)) + (offset_x, offset_y),
                        0,
                        [img_w, img_h],
                    ).flat
                )
                for point in ann.elements
            ]
        )
    else:
        assert False, f"Unsupported annotation type '{ann.type}'"

    return shifted_ann
