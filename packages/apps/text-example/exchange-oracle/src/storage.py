"""Module for interaction with S3 storage."""
from src.config import Config
from urllib.parse import urlparse
from basemodels import Manifest
from basemodels.manifest.data.taskdata import TaskDataEntry
from pathlib import Path
import json
from dataclasses import dataclass
from random import shuffle


@dataclass
class S3Info:
    host: str
    bucket_name: str
    object_name: str


def s3_info_from_url(s3_url):
    parsed = urlparse(s3_url)
    bucket_name, object_name = parsed.path[1:].split("/", maxsplit=1)
    host = parsed.netloc
    return S3Info(host, bucket_name, object_name)


def download_manifest(manifest_url):
    client = Config.storage_config.client()
    s3_info = s3_info_from_url(manifest_url)
    manifest = client.get_object(s3_info.bucket_name, s3_info.object_name)
    return Manifest(**json.loads(manifest.data))


def download_datasets(manifest: Manifest):
    job_dir = Config.storage_config.dataset_dir / str(manifest.job_id)
    job_dir.mkdir(parents=True, exist_ok=True)

    # store manifest
    with open(job_dir / "manifest.json", "w") as f:
        json.dump(manifest.json(), f)

    client = Config.storage_config.client()

    # download taskdata and groundtruth data files
    s3_info = s3_info_from_url(manifest.taskdata_uri)
    client.fget_object(
        s3_info.bucket_name, s3_info.object_name, job_dir / "taskdata.json"
    )

    if manifest.groundtruth_uri:
        s3_info = s3_info_from_url(manifest.groundtruth_uri)
        client.fget_object(
            s3_info.bucket_name, s3_info.object_name, job_dir / "groundtruth.json"
        )

    return job_dir


def convert_taskdata_to_doccano(job_dir: Path, client=Config.storage_config.client()):
    with open(job_dir / "taskdata.json", "r") as f:
        task_data = json.load(f)

    # add text and label fields, required for doccano
    # TODO: ensure groundtruth entries in file
    entries = []
    for entry in task_data:
        try:
            TaskDataEntry.validate(entry)
            s3_info = s3_info_from_url(entry["datapoint_uri"])
            entry["text"] = bytes.decode(
                client.get_object(s3_info.bucket_name, s3_info.object_name).data
            )
            entry["label"] = []
            entries.append(entry)
        except Exception as e:
            raise RuntimeError(f"Could not process entry {entry}: {e}")

    # split data into chunks for each project
    shuffle(entries)
    chunksize = Config.doccano.tasks_per_worker

    def chunks(a, n):
        """Yield successive n-sized chunks from lst."""
        for i in range(0, len(a), n):
            yield a[i : i + n]

    # write one file per project
    doccano_filepath = job_dir / "project_data"
    doccano_filepath.mkdir(exist_ok=True)
    for i, chunk in enumerate(chunks(entries, chunksize)):
        with open(doccano_filepath / f"{i}.jsonl", "w") as f:
            for entry in chunk:
                entry["chunk"] = i
                f.write(json.dumps(entry) + "\n")

    return doccano_filepath


def upload_data(
    path: Path,
    client=Config.storage_config.client(),
    bucket_name: str = Config.storage_config.results_bucket_name,
):
    files = []
    if path.is_file():
        files.append(path)
    elif path.is_dir():
        files.extend(path.glob("*.txt"))

    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)

    for file_path in files:
        client.fput_object(
            bucket_name=bucket_name,
            object_name=file_path.name,
            content_type="text/plain",
            file_path=file_path,
        )
