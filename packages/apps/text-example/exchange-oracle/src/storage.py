from src.config import Config
from urllib.parse import urlparse
from basemodels import Manifest
from basemodels.manifest.data.taskdata import TaskDataEntry
from pydantic import ValidationError
from pathlib import Path
import json


def get_bucket_and_object(s3_url):
    return urlparse(s3_url).path[1:].split("/", maxsplit=1)


def download_manifest(manifest_url):
    client = Config.storage_config.client()
    bucket_name, object_name = get_bucket_and_object(manifest_url)
    manifest = client.get_object(bucket_name, object_name)
    return Manifest.construct(**manifest.json())


def download_datasets(manifest: Manifest):
    job_dir = Config.storage_config.dataset_dir / str(manifest.job_id)

    # store manifest
    with open(job_dir / "manifest.json", "w") as f:
        json.dump(manifest.json(), f)

    client = Config.storage_config.client()

    # download taskdata and groundtruth data files
    bucket_name, object_name = get_bucket_and_object(manifest.taskdata_uri)
    client.fget_object(bucket_name, object_name, job_dir / "taskdata.json")

    if manifest.groundtruth_uri:
        bucket_name, object_name = get_bucket_and_object(manifest.groundtruth_uri)
        client.fget_object(bucket_name, object_name, job_dir / "groundtruth.json")

    return job_dir


def convert_taskdata_to_doccano(job_dir: Path):
    client = Config.storage_config.client()

    with open(job_dir / "taskdata.json", "r") as f:
        task_data = json.load(f)

    doccano_filepath = job_dir / "taskdata.doccano.jsonl"
    with open(doccano_filepath, "w") as f:
        for entry in task_data:
            try:
                TaskDataEntry.validate(entry)
                bucket, object_name = get_bucket_and_object(entry["datapoint_uri"])
                entry["text"] = client.get_object(bucket, object_name).data
                entry["label"] = []
                f.write(json.dumps(entry) + "\n")
            except Exception:
                pass

    return doccano_filepath
