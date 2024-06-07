import os
from copy import deepcopy
from glob import glob
from typing import Dict, Iterable, List, Optional, Sequence, Tuple, TypeVar, Union

import datumaro as dm
import numpy as np
from datumaro.util import filter_dict, mask_tools
from datumaro.util.annotation_util import find_group_leader, find_instances, max_bbox
from defusedxml import ElementTree as ET


def flatten_points(input_points: Sequence[dm.Points]) -> List[dm.Points]:
    results = []

    for pts in input_points:
        for point_idx in range(len(pts.points) // 2):
            point_x = pts.points[2 * point_idx + 0]
            point_y = pts.points[2 * point_idx + 1]

            point_v = pts.visibility[point_idx]
            if pts.attributes.get("outside") is True:
                point_v = dm.Points.Visibility.absent
            elif point_v == dm.Points.Visibility.visible and pts.attributes.get("occluded") is True:
                point_v = dm.Points.Visibility.hidden

            results.append(
                dm.Points(
                    [point_x, point_y],
                    visibility=[point_v],
                    label=pts.label,
                    attributes=filter_dict(pts.attributes, exclude_keys=["occluded", "outside"]),
                )
            )

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
    The function converts annotations from points to 1-point skeletons in the dataset.
    """

    def _get_skeleton_label(original_label: str) -> str:
        return original_label

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


T = TypeVar("T", bound=dm.Annotation)


def shift_ann(ann: T, offset_x: float, offset_y: float, *, img_w: int, img_h: int) -> T:
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


class ProjectLabels(dm.ItemTransform):
    """
    Changes the order of labels in the dataset from the existing
    to the desired one, removes unknown labels and adds new labels.
    Updates or removes the corresponding annotations.|n
    |n
    Labels are matched by names (case dependent). Parent labels are only kept
    if they are present in the resulting set of labels. If new labels are
    added, and the dataset has mask colors defined, new labels will obtain
    generated colors.|n
    |n
    Useful for merging similar datasets, whose labels need to be aligned.|n
    |n
    Examples:|n
    |s|s- Align the source dataset labels to [person, cat, dog]:|n

    |s|s.. code-block::

    |s|s|s|s%(prog)s -l person -l cat -l dog
    """

    @classmethod
    def build_cmdline_parser(cls, **kwargs):
        parser = super().build_cmdline_parser(**kwargs)
        parser.add_argument(
            "-l",
            "--label",
            action="append",
            dest="dst_labels",
            help="Label name (repeatable, ordered)",
        )
        return parser

    def __init__(
        self,
        extractor: dm.IExtractor,
        dst_labels: Union[Iterable[Union[str, Tuple[str, str]]], dm.LabelCategories],
    ):
        super().__init__(extractor)

        self._categories = {}

        src_categories = self._extractor.categories()

        src_label_cat: Optional[dm.LabelCategories] = src_categories.get(dm.AnnotationType.label)
        src_point_cat: Optional[dm.PointsCategories] = src_categories.get(dm.AnnotationType.points)

        if isinstance(dst_labels, dm.LabelCategories):
            dst_label_cat = deepcopy(dst_labels)
        else:
            dst_labels = list(dst_labels)

            if src_label_cat:
                dst_label_cat = dm.LabelCategories(attributes=deepcopy(src_label_cat.attributes))

                for dst_label in dst_labels:
                    assert isinstance(dst_label, str) or isinstance(dst_label, tuple)

                    dst_parent = ""
                    if isinstance(dst_label, tuple):
                        dst_label, dst_parent = dst_label

                    src_label = src_label_cat.find(dst_label, dst_parent)[1]
                    if src_label is not None:
                        dst_label_cat.add(
                            dst_label, src_label.parent, deepcopy(src_label.attributes)
                        )
                    else:
                        dst_label_cat.add(dst_label, dst_parent)
            else:
                dst_label_cat = dm.LabelCategories.from_iterable(dst_labels)

        for label in dst_label_cat:
            if label.parent not in dst_label_cat:
                label.parent = ""

        if src_point_cat:
            # Copy nested labels
            for skeleton_label_id, skeleton_spec in src_point_cat.items.items():
                skeleton_label = src_label_cat[skeleton_label_id]
                for child_label_name in skeleton_spec.labels:
                    if (
                        skeleton_label.name in dst_label_cat
                        and not dst_label_cat.find(child_label_name, parent=skeleton_label.name)[1]
                    ):
                        dst_label_cat.add(
                            child_label_name,
                            parent=skeleton_label.name,
                            attributes=skeleton_label.attributes,
                        )

        self._categories[dm.AnnotationType.label] = dst_label_cat

        self._make_label_id_map(src_label_cat, dst_label_cat)

        src_mask_cat = src_categories.get(dm.AnnotationType.mask)
        if src_mask_cat is not None:
            assert src_label_cat is not None
            dst_mask_cat = dm.MaskCategories(attributes=deepcopy(src_mask_cat.attributes))
            for old_id, old_color in src_mask_cat.colormap.items():
                new_id = self._map_id(old_id)
                if new_id is not None and new_id not in dst_mask_cat:
                    dst_mask_cat.colormap[new_id] = deepcopy(old_color)

            # Generate new colors for new labels, keep old untouched
            existing_colors = set(dst_mask_cat.colormap.values())
            color_bank = iter(
                mask_tools.generate_colormap(len(dst_label_cat), include_background=False).values()
            )
            for new_id, new_label in enumerate(dst_label_cat):
                if new_label.name in src_label_cat:
                    continue
                if new_id in dst_mask_cat:
                    continue

                color = next(color_bank)
                while color in existing_colors:
                    color = next(color_bank)

                dst_mask_cat.colormap[new_id] = color

            self._categories[dm.AnnotationType.mask] = dst_mask_cat

        if src_point_cat is not None:
            assert src_label_cat is not None
            dst_point_cat = dm.PointsCategories(attributes=deepcopy(src_point_cat.attributes))
            for old_id, old_cat in src_point_cat.items.items():
                new_id = self._map_id(old_id)
                if new_id is not None and new_id not in dst_point_cat:
                    dst_point_cat.items[new_id] = deepcopy(old_cat)

            self._categories[dm.AnnotationType.points] = dst_point_cat

    def _make_label_id_map(self, src_label_cat, dst_label_cat):
        id_mapping = {
            src_id: dst_label_cat.find(src_label_cat[src_id].name, src_label_cat[src_id].parent)[0]
            for src_id in range(len(src_label_cat or ()))
        }
        self._map_id = lambda src_id: id_mapping.get(src_id, None)

    def categories(self):
        return self._categories

    def transform_item(self, item):
        annotations = []
        for ann in item.annotations:
            if getattr(ann, "label", None) is not None:
                conv_label = self._map_id(ann.label)
                if conv_label is None:
                    continue

                ann = ann.wrap(label=conv_label)
            else:
                ann = ann.wrap()

            if ann and isinstance(ann, dm.Skeleton):
                ann = ann.wrap(elements=[e.wrap(label=self._map_id(e.label)) for e in ann.elements])

            annotations.append(ann)

        return item.wrap(annotations=annotations)


def is_point_in_bbox(px: float, py: float, bbox: dm.Bbox) -> bool:
    return (bbox.x <= px <= bbox.x + bbox.w) and (bbox.y <= py <= bbox.y + bbox.h)


class InstanceSegmentsToBbox(dm.ItemTransform):
    """
    Replaces instance segments (masks, polygons) with a single ("head") bbox.
    A group of annotations with the same group id is considered an "instance".
    The largest annotation in the group is considered the group "head".
    If there is a bbox in a group, it's used as the group "head".
    The resulting bbox takes properties from that "head" annotation.
    """

    def transform_item(self, item):
        annotations = []
        segments = []
        for ann in item.annotations:
            if ann.type in [
                dm.AnnotationType.polygon,
                dm.AnnotationType.mask,
                dm.AnnotationType.bbox,
            ]:
                segments.append(ann)
            else:
                annotations.append(ann)

        if not segments:
            return item

        instances = find_instances(segments)
        for instance_annotations in instances:
            instance_leader = find_group_leader(instance_annotations)
            instance_bbox = max_bbox(instance_annotations)
            instance_bbox_ann = dm.Bbox(
                *instance_bbox,
                label=instance_leader.label,
                z_order=instance_leader.z_order,
                id=instance_leader.id,
                attributes=instance_leader.attributes,
                group=instance_leader.group,
            )

            annotations.append(instance_bbox_ann)

        return self.wrap_item(item, annotations=annotations)
