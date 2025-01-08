from collections.abc import Iterable

from src.core.manifest import TaskManifest, parse_manifest


def generate_manifest(
    *,
    min_quality: float = 0.8,
    job_size: int = 10,
    validation_frames_per_job: int = 2,
    labels: int | Iterable[int] = 1,
) -> TaskManifest:
    label_definitions = []
    if isinstance(labels, int):
        label_definitions.extend({"name": f"label_{i}"} for i in range(labels))
    else:
        label_definitions.extend(
            {
                "name": f"label_{i}",
                "type": "skeleton",
                "nodes": [f"label_{i}_node_{j}" for j in range(label_sublabels)],
            }
            for i, label_sublabels in enumerate(labels)
        )

    data = {
        "data": {"data_url": "http://localhost:9010/datasets/sample"},
        "annotation": {
            "labels": label_definitions,
            "description": "",
            "user_guide": "",
            "type": "image_points",
            "job_size": job_size,
        },
        "validation": {
            "min_quality": min_quality,
            "val_size": validation_frames_per_job,
            "gt_url": "http://localhost:9010/datasets/sample/annotations/sample_gt.json",
        },
        "job_bounty": "0.0001",
    }

    return parse_manifest(data)
