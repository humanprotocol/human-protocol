import datumaro as dm
import numpy as np


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
