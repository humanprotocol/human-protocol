from typing import Optional

from src.services.cloud.client import S3Client


def download_file(bucket_host: str, bucket_name: str, filename: str) -> bytes:
    client = S3Client(bucket_host)
    return client.download_fileobj(bucket_name, filename)


def list_files(bucket_host: str, bucket_name: str, path: Optional[str] = None) -> list[str]:
    client = S3Client(bucket_host)
    return [f.key for f in client.list_files(bucket_name, path=path)]
