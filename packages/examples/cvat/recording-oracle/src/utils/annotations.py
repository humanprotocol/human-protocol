from copy import deepcopy
from typing import Iterable, Optional, Tuple, Union

import datumaro as dm
import numpy as np
from datumaro.util import mask_tools


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
        self._map_id = lambda src_id: id_mapping.get(src_id)

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
