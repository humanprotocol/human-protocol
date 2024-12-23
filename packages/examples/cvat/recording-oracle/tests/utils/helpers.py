from src.core.manifest import TaskManifest, parse_manifest


def generate_manifest(
    *, min_quality: float = 0.8, job_size: int = 10, validation_frames_per_job: int = 2
) -> TaskManifest:
    data = {
        "data": {"data_url": "http://localhost:9010/datasets/sample"},
        "annotation": {
            "labels": [{"name": "person"}],
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
